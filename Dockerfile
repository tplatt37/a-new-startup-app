# A-New-Startup - A NodeJS application 
#
# First, we run unit tests.  This is a multi-stage build.
#
FROM public.ecr.aws/docker/library/node:18-alpine3.18 as unit-tests

WORKDIR /usr/src/app

COPY package*.json ./

ENV PORT=3000

# To run tests we have to do a regular install which will include the dev dependencies
RUN npm install -g npm@latest && npm install 

COPY . . 

# This will run the jest tests. These are unit tests.  There's no connectivity to Dynamo, SNS, or anything else
# So we don't have to set any Environment Variables related to that.  
RUN [ "npm", "test" ]

# After tests have passed, we build the final container image
#
# The Nodejs standard base image is about 1 GB!
#FROM public.ecr.aws/vend/node:18 as final
#
# Using this Alpine base image, our final image should be approx 300 MB.
#
FROM public.ecr.aws/docker/library/node:18-alpine3.18 as final

# Run as a non-root user. Node base image has a user named "node" but we create one here to show how it is done.
# We're creating the user as 101 - need a deterministic user id because k8s will use this to check for non-rootness (see related Helm chart)
RUN addgroup --gid 1001 app && adduser --system --uid 101 --ingroup app app && mkdir /app && chown app:app /app 

WORKDIR /app

COPY --from=unit-tests /usr/src/app/package*.json ./

# These really should be set in the Task/Pod or via CodeDeploy
ENV PORT=3000

# chown option is needed otherwise files end up owned by root.
COPY --chown=app:app --from=unit-tests /usr/src/app/ . 

# Production install so we don't have all the dev dependencies
RUN npm install -g npm@latest && npm install --omit=dev

# Run as user 101 "App"
USER app

# Will be listening on port 3000
EXPOSE 3000

# Use node to run the server.
CMD [ "node", "src/server.js" ]
