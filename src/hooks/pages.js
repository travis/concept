import { useParams } from "react-router-dom";
import { usePage } from "./data"

export function useCurrentPage() {
  const { selectedPage } = useParams();
  return usePage(selectedPage ? decodeURIComponent(selectedPage) : undefined)
}
