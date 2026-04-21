import pandas as pd

df = pd.read_csv("train_transaction.csv")

# Get high-signal fraud: large amounts, missing address, product C
fraud = df[
    (df['isFraud'] == 1) &
    (df['TransactionAmt'] > 100) &
    (df['addr1'].isna() | (df['dist1'] > 200))
].sample(8, random_state=99)

# Get clearly legitimate: small amounts, address present, low distance
legit = df[
    (df['isFraud'] == 0) &
    (df['TransactionAmt'] < 80) &
    (df['addr1'].notna()) &
    (df['dist1'] < 50)
].sample(7, random_state=99)

sample = pd.concat([fraud, legit])
print(sample[['TransactionID','TransactionAmt','ProductCD','card4','card6','addr1','addr2','dist1','isFraud']].to_string())