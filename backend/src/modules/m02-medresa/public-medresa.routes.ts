import { Router } from "express";
import { getPublicMedresasHandler } from "./medresa.controller";

const publicMedresaRoutes = Router();

publicMedresaRoutes.get("/medresas", getPublicMedresasHandler);

export default publicMedresaRoutes;
