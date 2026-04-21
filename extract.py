import pandas as pd
import xgboost as xgb
import shap
import lime
from lime import lime_tabular
import json
import numpy as np

df = pd.read_csv("train_transaction.csv")

# Use only available features
features = ['TransactionAmt', 'ProductCD', 'card4', 'card6', 'addr1', 'dist1']
df_model = df[features + ['isFraud']].copy()

# Encode categoricals
df_model['ProductCD'] = df_model['ProductCD'].astype('category').cat.codes
df_model['card4'] = df_model['card4'].astype('category').cat.codes
df_model['card6'] = df_model['card6'].astype('category').cat.codes
df_model = df_model.fillna(-1)

X = df_model.drop('isFraud', axis=1)
y = df_model['isFraud']

# Train XGBoost
model = xgb.XGBClassifier(n_estimators=100, random_state=42, eval_metric='logloss')
model.fit(X, y)

# Our 15 transactions
txn_ids = [3519372,3053108,3492704,3560122,3104673,3320693,3407378,3044105,
           3557070,3336054,3330843,3034548,3354853,3124696,3453553]

sample = df[df['TransactionID'].isin(txn_ids)][features].copy()
sample['ProductCD'] = sample['ProductCD'].astype('category').cat.codes
sample['card4'] = sample['card4'].astype('category').cat.codes
sample['card6'] = sample['card6'].astype('category').cat.codes
sample_filled = sample.fillna(-1)

# SHAP values
explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(sample_filled)

# LIME values
lime_explainer = lime_tabular.LimeTabularExplainer(
    X.values, feature_names=features, class_names=['legit','fraud'], mode='classification'
)

results = {}
for i, txn_id in enumerate(txn_ids):
    row = sample_filled.iloc[i].values
    # SHAP
    shap_dict = {features[j]: round(float(shap_values[i][j]), 4) for j in range(len(features))}
    # LIME
    lime_exp = lime_explainer.explain_instance(row, model.predict_proba, num_features=6)
    lime_dict = {feat: round(weight, 4) for feat, weight in lime_exp.as_list()}
    # Score
    score = float(model.predict_proba([row])[0][1])
    results[str(txn_id)] = {'score': round(score, 4), 'shap': shap_dict, 'lime': lime_dict}

print(json.dumps(results, indent=2))