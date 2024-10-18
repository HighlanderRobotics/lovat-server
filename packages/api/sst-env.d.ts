/* This file is auto-generated by SST. Do not edit. */
/* tslint:disable */
/* eslint-disable */
import "sst"
export {}
declare module "sst" {
  export interface Resource {
    "Auth0Domain": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "DeploymentMigrate": {
      "name": string
      "type": "sst.aws.Function"
    }
    "LovatAPI": {
      "name": string
      "type": "sst.aws.Function"
      "url": string
    }
    "LovatDB": {
      "database": string
      "host": string
      "password": string
      "port": number
      "type": "sst.aws.Postgres"
      "username": string
    }
    "LovatSigningKey": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "LovatVPC": {
      "bastion": string
      "type": "sst.aws.Vpc"
    }
    "ResendKey": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "SlackWebhook": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "TBAKey": {
      "type": "sst.sst.Secret"
      "value": string
    }
  }
}