import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { EventDiscovery } from "./pages/EventDiscovery";
import { EventDetails } from "./pages/EventDetails";
import { BookingFlow } from "./pages/BookingFlow";
import { UserDashboard } from "./pages/UserDashboard";
import { OrganizerDashboard } from "./pages/OrganizerDashboard";
import { AdminDashboard } from "./pages/AdminDashboard";
import { HelpCenter } from "./pages/HelpCenter";
import { SignIn } from "./pages/SignIn";
import { SignUp } from "./pages/SignUp";
import { NotFound } from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/discover",
    Component: EventDiscovery,
  },
  {
    path: "/event/:id",
    Component: EventDetails,
  },
  {
    path: "/book/:id",
    Component: BookingFlow,
  },
  {
    path: "/user/*",
    Component: UserDashboard,
  },
  {
    path: "/user",
    Component: UserDashboard,
  },
  {
    path: "/organizer/*",
    Component: OrganizerDashboard,
  },
  {
    path: "/organizer",
    Component: OrganizerDashboard,
  },
  {
    path: "/admin/*",
    Component: AdminDashboard,
  },
  {
    path: "/admin",
    Component: AdminDashboard,
  },
  {
    path: "/help",
    Component: HelpCenter,
  },
  {
    path: "/signin",
    Component: SignIn,
  },
  {
    path: "/signup",
    Component: SignUp,
  },
  {
    path: "*",
    Component: NotFound,
  },
]);
