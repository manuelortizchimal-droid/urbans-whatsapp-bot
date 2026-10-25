import { Router } from "express";
import { requireInternalApiKey } from "../utils/auth";
import { getLeadHandler, listLeadsHandler, patchLeadHandler } from "../controllers/leads.controller";
import { mockMessageHandler } from "../controllers/mock.controller";

import { createOwnerProspect, listOwnerProspects, patchOwnerProspect } from "../controllers/ownerProspects.controller";

export const apiRouter = Router();
apiRouter.use(requireInternalApiKey);
apiRouter.post("/mock/message", mockMessageHandler);
apiRouter.get("/leads", listLeadsHandler);
apiRouter.get("/leads/:id", getLeadHandler);
apiRouter.patch("/leads/:id", patchLeadHandler);

apiRouter.post("/owner-prospects",createOwnerProspect);
apiRouter.get("/owner-prospects",listOwnerProspects);
apiRouter.patch("/owner-prospects/:id",patchOwnerProspect);
