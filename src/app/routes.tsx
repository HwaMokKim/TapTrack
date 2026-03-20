import { createBrowserRouter } from "react-router";
import { Onboarding } from "./components/onboarding";
import { MainApp } from "./components/main-app";
import { Settings } from "./components/settings";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Onboarding,
  },
  {
    path: "/app",
    Component: MainApp,
  },
  {
    path: "/settings",
    Component: Settings,
  },
]);
