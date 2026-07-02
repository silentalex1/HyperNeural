"""
Deployment Example
Shows how to deploy a trained model to HyperNeural hosting
"""

from hyperneural_turbo.deploy import HyperDeployer
from pathlib import Path

def main():
    deployer = HyperDeployer(
        api_url="https://hyperneural.cfd",
        api_key="your-api-key-here"
    )

    model_path = Path("./models/QuickStartAI/final")
    
    success = deployer.deploy_model(
        model_path=model_path,
        name="QuickStartAI",
        description="A helpful assistant for programming questions",
        base_model="llama3.1-8b",
        username="your-username",
        password="your-password"
    )

    if success:
        print("Model deployed successfully!")
    else:
        print("Deployment failed")

if __name__ == "__main__":
    main()
