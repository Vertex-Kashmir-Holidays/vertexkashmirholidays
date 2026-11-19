-- Proposal assignee: hand a proposal to another sales person (owner + assignee both see it).
ALTER TABLE "ProposalItinerary" ADD COLUMN "assignedToId" TEXT;

CREATE INDEX "ProposalItinerary_assignedToId_idx" ON "ProposalItinerary"("assignedToId");

ALTER TABLE "ProposalItinerary" ADD CONSTRAINT "ProposalItinerary_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
