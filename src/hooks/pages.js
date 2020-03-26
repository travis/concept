import { useParams } from "react-router-dom";

export function useCurrentPage() {
  const { selectedPage } = useParams();
  const selectedPageURI = decodeURIComponent(selectedPage)
  return selectedPageURI
}
