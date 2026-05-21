import pandas as pd
import numpy as np
import os
import tensorflow as tf
from sklearn.model_selection import train_test_split

def train_model():
    # grab the fake data we just made
    data_path = os.path.join(os.path.dirname(__file__), 'synthetic_dataset.csv')
    df = pd.read_csv(data_path)
    
    # inputs
    X = df[['headcount', 'predominant_bearing', 'opposite_count']].values
    
    # outputs
    y_density = df['density_label'].values
    y_flow = df['opposite_flow_label'].values
    
    # split it up
    X_train, X_test, y_density_train, y_density_test, y_flow_train, y_flow_test = train_test_split(
        X, y_density, y_flow, test_size=0.2, random_state=42
    )
    
    # throw together a quick keras model lmao
    inputs = tf.keras.Input(shape=(3,), name='features')
    
    x = tf.keras.layers.Dense(32, activation='relu')(inputs)
    x = tf.keras.layers.Dense(16, activation='relu')(x)
    
    # two heads are better than one
    output_density = tf.keras.layers.Dense(1, activation='linear', name='density_output')(x)
    output_flow = tf.keras.layers.Dense(1, activation='sigmoid', name='flow_output')(x)
    
    model = tf.keras.Model(inputs=inputs, outputs=[output_density, output_flow])
    
    # compile this bad boy
    model.compile(
        optimizer='adam',
        loss={
            'density_output': 'mse',
            'flow_output': 'binary_crossentropy'
        },
        metrics={
            'density_output': 'mae',
            'flow_output': 'accuracy'
        }
    )
    
    print("training model... pls wait")
    model.fit(
        X_train, 
        {'density_output': y_density_train, 'flow_output': y_flow_train},
        epochs=10,
        batch_size=32,
        validation_split=0.2,
        verbose=1
    )
    
    print("\nevaluating yay...")
    results = model.evaluate(X_test, {'density_output': y_density_test, 'flow_output': y_flow_test}, verbose=0)
    print(f"loss: {results[0]:.4f}")
    
    # save it so we can use it in index.py
    model_path = os.path.join(os.path.dirname(__file__), 'crowd_model.keras')
    model.save(model_path)
    print(f"saved to {model_path} yay!")

if __name__ == '__main__':
    train_model()
