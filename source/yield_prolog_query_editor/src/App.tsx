import './App.css'
import QueryEditor from "./components/QueryEditor/QueryEditor.lazy.tsx";
import {createBrowserRouter, RouterProvider} from "react-router-dom";
import FirstTutorial from "./components/FirstTutorial/FirstTutorial.lazy.tsx";
import SecondTutorial from "./components/SecondTutorial/SecondTutorial.lazy.tsx";

function App() {

  const router = createBrowserRouter([
    {
      path: "/",
      element: <QueryEditor/>
    },
    {
      path: "/first",
      element: <FirstTutorial/>
    },
    {
      path: "/second",
      element: <SecondTutorial/>
    }
  ]);
  return (
    <div className="App">
      <RouterProvider router={router}/>
    </div>
  );
}

export default App
