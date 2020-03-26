import { useParams } from "react-router-dom";

export function useCurrentPage() {
  const { selectedPage } = useParams();
  return selectedPage ? decodeURIComponent(selectedPage) : undefined
}
