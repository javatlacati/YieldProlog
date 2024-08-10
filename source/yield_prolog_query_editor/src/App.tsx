import './App.css'
import QueryEditor from "./components/QueryEditor/QueryEditor.lazy.tsx";
import {createBrowserRouter, RouterProvider} from "react-router-dom";

function App() {

  const router = createBrowserRouter([
    {
      path: "/",
      element: <QueryEditor/>
    }
  ]);
  return (
    <div className="App">
      <RouterProvider router={router}/>
    </div>
  );
}

export default App
