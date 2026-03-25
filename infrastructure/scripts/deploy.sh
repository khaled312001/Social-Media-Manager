#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="barmagly"
IMAGE_TAG="${IMAGE_TAG:-latest}"
REGISTRY="${REGISTRY:-ghcr.io/your-org}"

echo "🚀 Deploying Barmagly to Kubernetes..."
echo "   Registry : $REGISTRY"
echo "   Tag      : $IMAGE_TAG"
echo "   Namespace: $NAMESPACE"

# Update image tags in-place
sed -i "s|ghcr.io/barmagly/api:latest|$REGISTRY/barmagly-api:$IMAGE_TAG|g" \
  infrastructure/k8s/deployments/api.yaml infrastructure/k8s/deployments/worker.yaml

sed -i "s|ghcr.io/barmagly/web:latest|$REGISTRY/barmagly-web:$IMAGE_TAG|g" \
  infrastructure/k8s/deployments/web.yaml

# Apply all manifests
kubectl apply -k infrastructure/k8s/

# Wait for rollouts
echo "⏳ Waiting for API rollout..."
kubectl rollout status deployment/api -n "$NAMESPACE" --timeout=300s

echo "⏳ Waiting for Web rollout..."
kubectl rollout status deployment/web -n "$NAMESPACE" --timeout=300s

echo "✅ Deployment complete!"
