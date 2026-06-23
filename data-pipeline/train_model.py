import pandas as pd
import numpy as np
import os
import json
import joblib
from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.metrics import classification_report, confusion_matrix, f1_score
import lightgbm as lgb
import warnings

warnings.filterwarnings('ignore')

def main():
    # Define directories
    artifacts_dir = os.path.join(os.path.dirname(__file__), 'artifacts')
    clean_data_path = os.path.join(artifacts_dir, 'cleaned_data.parquet')
    
    # 1. Load data and filter to valid duration
    df = pd.read_parquet(clean_data_path)
    df_valid = df.dropna(subset=['event_duration_hours']).copy()
    
    # 2. Define Features and Target (Leakage check: NO severity_score, NO duration used)
    features = [
        'event_cause', 
        'corridor', 
        'priority', 
        'hour_of_day', 
        'day_of_week', 
        'is_weekend'
    ]
    target = 'severity_bucket'
    
    print("\n--- LEAKAGE CHECK: FINAL FEATURE COLUMNS ---")
    for f in features:
        print(f" - {f}")
    print("Target variable:")
    print(f" - {target}")
    print("\nConfirmed: No duration, completion_time, severity_score, or requires_road_closure features are included.")
    
    # Convert categorical columns to 'category' dtype for LightGBM
    categorical_features = ['event_cause', 'corridor', 'priority']
    for col in categorical_features:
        df_valid[col] = df_valid[col].astype('category')
        
    X = df_valid[features]
    y = df_valid[target]
    
    print(f"\nTraining data shape: {X.shape}")
    print(f"Class Balance:\n{y.value_counts()}")
    
    # Check if accident and congestion are still present but acknowledged as skewed
    print("\n--- LIMITATION ACKNOWLEDGMENTS ---")
    print("1. High Bucket Coarseness: The 'High' severity bucket covers a massive range (5.5h to 639.9h).")
    print("   This is a known limitation. The recommendation engine will use median clearance time")
    print("   rather than relying purely on this coarse classification bucket.")
    print("2. Survivorship Bias: 'accident' and 'congestion' have very low valid rows (91 and 22).")
    print("   The classifier will likely learn weak/skewed patterns for these. This is flagged as a limitation.")
    
    # 3. Model Setup (LightGBM handles categoricals natively)
    clf = lgb.LGBMClassifier(
        n_estimators=100,
        random_state=42,
        class_weight='balanced', # Helps with the 10:1 Critical imbalance
        n_jobs=-1,
        verbose=-1
    )
    
    # 4. Stratified 5-Fold Cross Validation
    print("\n--- 5-FOLD CROSS VALIDATION RESULTS ---")
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    
    cv_reports = []
    cv_macro_f1 = []
    
    for train_idx, test_idx in skf.split(X, y):
        X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
        y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]
        
        clf.fit(X_train, y_train)
        y_pred = clf.predict(X_test)
        
        report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
        cv_reports.append(report)
        cv_macro_f1.append(report['macro avg']['f1-score'])
        
    print(f"Mean Macro-F1 across 5 folds: {np.mean(cv_macro_f1):.3f} ± {np.std(cv_macro_f1):.3f}")
    
    # Aggregate per-class metrics over the 5 folds
    classes = y.unique()
    classes = [c for c in classes if not pd.isna(c)]
    
    print("\nPer-class average metrics across CV:")
    for cls in ['Low', 'Medium', 'High', 'Critical']:
        if cls in classes:
            prec = np.mean([r[cls]['precision'] for r in cv_reports if cls in r])
            rec = np.mean([r[cls]['recall'] for r in cv_reports if cls in r])
            f1 = np.mean([r[cls]['f1-score'] for r in cv_reports if cls in r])
            support = np.mean([r[cls]['support'] for r in cv_reports if cls in r])
            print(f"[{cls}] Precision: {prec:.3f} | Recall: {rec:.3f} | F1: {f1:.3f} | Support (avg): {support:.1f}")
            
    # 5. Final Train/Test Split (80/20) for saving the model
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
    clf.fit(X_train, y_train)
    y_pred = clf.predict(X_test)
    
    print("\n--- FINAL 80/20 TEST SET PERFORMANCE ---")
    final_macro_f1 = f1_score(y_test, y_pred, average='macro')
    print(f"Final Macro-F1: {final_macro_f1:.3f}")
    print(classification_report(y_test, y_pred, zero_division=0))
    
    print("\nConfusion Matrix:")
    labels = ['Low', 'Medium', 'High', 'Critical']
    cm = confusion_matrix(y_test, y_pred, labels=labels)
    cm_df = pd.DataFrame(cm, index=[f"True {l}" for l in labels], columns=[f"Pred {l}" for l in labels])
    print(cm_df)
    
    # Determine confidence for the demo
    is_reliable = final_macro_f1 >= 0.5
    confidence_reason = "Model meets performance threshold." if is_reliable else "Macro-F1 < 0.5. The model should be treated as a directional signal only."
    
    # Also check if Critical recall is effectively zero
    critical_report = classification_report(y_test, y_pred, output_dict=True, zero_division=0).get('Critical', {})
    if critical_report.get('recall', 0) < 0.1:
        is_reliable = False
        confidence_reason += " Additionally, recall for the 'Critical' class is extremely low, meaning severe events are consistently missed."
        print("\n[WARNING] Critical recall is near zero. Flagging model as unreliable for severe incident predictions.")

    # Save Confidence Flag
    confidence_data = {
        "reliable": bool(is_reliable),
        "reason": confidence_reason,
        "macro_f1": float(final_macro_f1),
        "critical_recall": float(critical_report.get('recall', 0))
    }
    with open(os.path.join(artifacts_dir, 'model_confidence.json'), 'w') as f:
        json.dump(confidence_data, f, indent=2)
        
    print(f"\nModel Reliable Flag: {is_reliable}")
    print(f"Reason: {confidence_reason}")
    
    # Save Model
    model_path = os.path.join(artifacts_dir, 'model.pkl')
    joblib.dump(clf, model_path)
    print(f"Model saved to {model_path}")
    
    # Feature Importance
    importance = clf.feature_importances_
    feat_imp = pd.DataFrame({'feature': features, 'importance': importance})
    feat_imp = feat_imp.sort_values('importance', ascending=False)
    
    print("\nFeature Importance:")
    print(feat_imp.to_string(index=False))
    
    feat_imp_dict = feat_imp.to_dict(orient='records')
    with open(os.path.join(artifacts_dir, 'feature_importance.json'), 'w') as f:
        json.dump(feat_imp_dict, f, indent=2)

if __name__ == '__main__':
    main()
