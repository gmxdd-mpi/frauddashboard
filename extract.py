import pandas as pd

df = pd.read_csv("train_transaction.csv")

fraud = df[df['isFraud'] == 1].sample(8, random_state=42)
legit = df[df['isFraud'] == 0].sample(7, random_state=42)
sample = pd.concat([fraud, legit])

print(sample[['TransactionID','TransactionAmt','ProductCD','card4','card6','addr1','addr2','dist1','isFraud']].to_string())