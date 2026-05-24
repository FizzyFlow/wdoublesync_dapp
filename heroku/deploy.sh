cp -rfT config ../$1/dist/config
cp Procfile ../$1/dist/Procfile

(cd "../$1/dist" && heroku buildpacks:add https://buildpack-registry.s3.amazonaws.com/buildpacks/heroku-community/nginx.tgz --app $2)
(cd "../$1/dist" && heroku builds:create -a $2)