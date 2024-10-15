export const vpc = new sst.aws.Vpc("LovatVPC", {
  nat: "managed",
  bastion: true,
});
