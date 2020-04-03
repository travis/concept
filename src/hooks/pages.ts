import { useParams } from "react-router-dom";
import { usePage } from "./data"
import { Page } from "../utils/model"

export function useCurrentPage(): [Page | undefined, boolean, Error | undefined] {
  const { selectedPage } = useParams();
  return usePage(selectedPage ? decodeURIComponent(selectedPage) : undefined)
}

export function useCurrentPageUri(): string | undefined {
  const { selectedPage } = useParams();
  return selectedPage ? decodeURIComponent(selectedPage) : undefined
}
