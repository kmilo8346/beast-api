 #!/bin/sh

echo "creating namespace"
# kubekubectl apply -f namespace.yaml
echo "creating deployment"
# kubectl apply -f deployment.yaml
echo "creating service"    
# kubectl apply -f service.yaml

#kubectl get services --watch

# docker build --tag kmilo8346/beast-api:staging-2 .
# docker push kmilo8346/beast-api:staging-2