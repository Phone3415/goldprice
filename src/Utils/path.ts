import { Path } from "oop-path";

const PATH: Record<string, Path> = {
  root: new Path(__dirname).join("../../").resolve(),
};
PATH.frontEnd = PATH.root.join("front-end");
PATH.static = PATH.root.join("static");

export default PATH;
