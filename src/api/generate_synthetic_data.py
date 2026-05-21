import pandas as pd
import numpy as np
import os

def generate_data(num_samples=5000):
    np.random.seed(42)
    
    # headcount is like 0 to 50 ppl
    headcount = np.random.randint(0, 50, size=num_samples)
    
    # direction they are walking
    predominant_bearing = np.random.uniform(0, 360, size=num_samples)
    
    # ppl going the wrong way, usually 0 but sometimes they crazy
    opposite_count = np.zeros(num_samples)
    for i in range(num_samples):
        if headcount[i] > 5:
            # 20% chance of a bottleneck event lmao
            if np.random.rand() > 0.8:
                opposite_count[i] = np.random.randint(1, int(headcount[i] * 0.4) + 2)
                
    # labels for training
    # density trends up if opposite_count is high (bottleneck) yay
    density_label = headcount + (opposite_count * 2) + np.random.randint(-2, 5, size=num_samples)
    density_label = np.clip(density_label, 0, None)
    
    # 1 if bad, 0 if fine
    opposite_flow_label = (opposite_count > 2).astype(int)
    
    df = pd.DataFrame({
        'headcount': headcount,
        'predominant_bearing': predominant_bearing,
        'opposite_count': opposite_count,
        'density_label': density_label,
        'opposite_flow_label': opposite_flow_label
    })
    
    output_path = os.path.join(os.path.dirname(__file__), 'synthetic_dataset.csv')
    df.to_csv(output_path, index=False)
    print(f"made {num_samples} fake rows at {output_path} yay")

if __name__ == '__main__':
    generate_data()
