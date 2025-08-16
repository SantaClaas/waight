/* @refresh reload */
import { render } from "solid-js/web";
import "./index.css";
import App from "./App.tsx";
import { Route, Router } from "@solidjs/router";
import Debug from "./Debug.tsx";

render(
  () => (
    <Router>
      <Route path="/" component={App} />
      <Route path="/debug" component={Debug} />
    </Router>
  ),
  document.body
);
