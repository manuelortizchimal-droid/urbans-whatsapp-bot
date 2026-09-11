import { Router } from "express";
import { requireInternalApiKey } from "../utils/auth";
import { getLeadHandler, listLeadsHandler, patchLeadHandler } from "../controllers/leads.controller";
import { mockMessageHandler } from "../controllers/mock.controller";

export const apiRouter = Router();
apiRouter.use(requireInternalApiKey);
apiRouter.post("/mock/message", mockMessageHandler);
apiRouter.get("/leads", listLeadsHandler);
apiRouter.get("/leads/:id", getLeadHandler);
apiRouter.patch("/leads/:id", patchLeadHandler);
