import { Home } from "src/intents/design_editor/home";
import { ErrorPage } from "src/pages/error";
import { GeneratePage } from "src/pages/generate";
import { ResultsPage } from "src/pages/results";
import { UploadPage } from "src/pages/upload"; // <-- 1. Import your new Upload page
import { Paths } from "src/routes/paths";

export const routes = [
  {
    path: Paths.HOME,
    element: <Home />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true, // <-- 2. This makes the UploadPage the very first screen!
        element: <UploadPage />,
      },
      {
        path: "generate", // <-- 3. Give GeneratePage its own path
        element: <GeneratePage />,
      },
      {
        path: Paths.RESULTS,
        element: <ResultsPage />,
      },
      // @TODO: Add additional pages and routes as needed.
    ],
  },
];