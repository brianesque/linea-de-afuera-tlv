import Home from './pages/Home';
import Players from './pages/Players';
import CreateTournament from './pages/CreateTournament';
import TournamentDetail from './pages/TournamentDetail';
import OrganizeTeams from './pages/OrganizeTeams';
import Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Players": Players,
    "CreateTournament": CreateTournament,
    "TournamentDetail": TournamentDetail,
    "OrganizeTeams": OrganizeTeams,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: Layout,
};