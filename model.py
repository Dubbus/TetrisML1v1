import pickle
import numpy as np
from sklearn.neural_network import MLPRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

import pandas as pd
import os

folder_path = "./data"
data_vectors = []
for filename in os.listdir("./data"):
    if filename.endswith(".csv"):
        file_path = os.path.join(folder_path, filename)
        
        # Read CSV with pandas
        df = pd.read_csv(file_path)
        
        # Convert to list of vectors and append
        data_vectors.extend(df.values.tolist())

X = data_vectors[:len(data_vectors)-1]
y = data_vectors[1:]

#GAMEWIDTH = 10

#    floor heights    block horizontal position    block type    block orientation
# [    1,... GW,            GW+1,... GW*2,           GW*2+1,           GW*2+2       ]

#test_input_string = [ (GAMEWIDTH * 2) + 2 ]

#test_output_string = [ (GAMEWIDTH * 2) + 2 ]

# ---- PREPROCESSING ----
scaler_x = StandardScaler()
scaler_y = StandardScaler()

X_scaled = scaler_x.fit_transform(X)
y_scaled = scaler_y.fit_transform(y)

# ---- TRAIN/TEST SPLIT ----
X_train, X_test, y_train, y_test = train_test_split(X_scaled, y_scaled, test_size=0.2, random_state=42)

# ---- MODEL ----
mlp = MLPRegressor(
    hidden_layer_sizes=(128, 64),
    activation='relu',
    solver='adam',
    max_iter=1000,
    random_state=0
)

# ---- TRAIN ----
mlp.fit(X_train, y_train)
print(f"Success rate: {mlp.score(X_test, y_test):.4f}")

with open("tetris_model1.pkl", "wb") as f:
    pickle.dump(mlp, f)

# ---- PREDICT ----
#while True:
#    sample_input = [X_test[int(input("samplenum"))]]
#    predicted_scaled = mlp.predict(sample_input)
#    predicted_next_state = scaler_y.inverse_transform(predicted_scaled)
#    rounded_next_state = np.round(predicted_next_state).tolist()
#
#    print("\nExample prediction:")
#    print("Current state:", scaler_x.inverse_transform(sample_input).tolist())
#    print("Predicted next state:", rounded_next_state)