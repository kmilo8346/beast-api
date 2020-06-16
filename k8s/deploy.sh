 #!/bin/sh

echo "creating namespace"
# kubekubectl create -f namespace.yaml
echo "creating deployment"
# kubectl create -f deployment.yaml
echo "creating service"    
# kubectl create -f service.yaml

#kubectl get services --watch