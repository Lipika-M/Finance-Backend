import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
const app = express();
app.use(cors(
    {origin: process.env.CORS_ORIGIN,
    credentials: true}
));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true , limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
//routes
import userRoutes from "./routes/user.routes.js";
import financialRecordRoutes from "./routes/financialRecord.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/financial-records", financialRecordRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use(errorHandler);

export { app };