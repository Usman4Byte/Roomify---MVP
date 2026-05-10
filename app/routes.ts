import {type RouteConfig, index, route} from "@react-router/dev/routes";

export default [
    route(".well-known/*", "./routes/well-known.$.tsx"),
    route("api/generate", "./routes/api.generate.ts"),
    index("routes/home.tsx"),
    route('visualizer/:id', './routes/visualizer.$id.tsx')
] satisfies RouteConfig;
