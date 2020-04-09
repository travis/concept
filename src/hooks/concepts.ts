import { useParams } from "react-router-dom";
import { useConcept } from "./data"
import { Concept } from "../utils/model"

export function useCurrentConcept(): [Concept | undefined, boolean, Error | undefined] {
  const { selectedConcept } = useParams();
  return useConcept(selectedConcept ? decodeURIComponent(selectedConcept) : undefined)
}

export function useCurrentConceptUri(): string | undefined {
  const { selectedConcept } = useParams();
  return selectedConcept ? decodeURIComponent(selectedConcept) : undefined
}
