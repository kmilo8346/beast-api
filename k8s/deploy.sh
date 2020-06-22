 #!/bin/sh

# docker build --tag kmilo8346/beast-api:staging-3 .

# docker push kmilo8346/beast-api:staging-3

echo "creating namespace"
kubekubectl apply -f namespace.yaml

echo "creating deployment"
kubectl apply -f deployment.yaml

echo "creating service"    
kubectl apply -f service.yaml

kubectl get services --watch --namespace beast

