import Home from './pages/Home';
import Players from './pages/Players';
import CreateTournament from './pages/CreateTournament';
import Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Players": Players,
    "CreateTournament": CreateTournament,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: Layout,
};