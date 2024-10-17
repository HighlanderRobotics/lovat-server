export const vpc = new sst.aws.Vpc("LovatVPC", {
  nat: "ec2",
  bastion: true,
});
