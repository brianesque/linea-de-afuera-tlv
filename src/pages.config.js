import Home from './pages/Home';
import Players from './pages/Players';
import CreateTournament from './pages/CreateTournament';
import TournamentDetail from './pages/TournamentDetail';
import OrganizeTeams from './pages/OrganizeTeams';
import TournamentResults from './pages/TournamentResults';
import AdminPanel from './pages/AdminPanel';
import PlayerStats from './pages/PlayerStats';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Players": Players,
    "CreateTournament": CreateTournament,
    "TournamentDetail": TournamentDetail,
    "OrganizeTeams": OrganizeTeams,
    "TournamentResults": TournamentResults,
    "AdminPanel": AdminPanel,
    "PlayerStats": PlayerStats,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};