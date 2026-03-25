#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="barmagly"

echo "🗄️  Running database migrations..."
kubectl exec -n "$NAMESPACE" deployment/api -- \
  sh -c "cd /app && npx prisma migrate deploy"

echo "🌱 Running database seed (skips if already seeded)..."
kubectl exec -n "$NAMESPACE" deployment/api -- \
  sh -c "cd /app && npx prisma db seed" || echo "Seed already ran or skipped."

echo "✅ Migrations complete!"
