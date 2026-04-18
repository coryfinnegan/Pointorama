var builder = DistributedApplication.CreateBuilder(args);

var web = builder.AddNpmApp("web", "../web", "dev")
    .WithHttpEndpoint(env: "PORT", port: 3000)
    .WithExternalHttpEndpoints();

builder.Build().Run();
