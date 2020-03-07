import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";
import Home from "../views/Home.vue";
import About from "../views/About.vue";

Vue.use(VueRouter);

const routes: RouteConfig[] = [
  {
    path: "/",
    name: "Home",
    component: Home,
    meta: {
      title: 'Calendar events app'
    }
  },
  {
    path: "/about",
    name: "About",
    component: About,
    meta: {
      title: 'About the creator'
    }
  }
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes
});

export default router;
