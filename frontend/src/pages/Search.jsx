import '../components/layout/Search.css'
import Layout from '../components/layout/Layout'

export default function Search() {
    return (
        <Layout>
            <div className="search-page">
                <input type="text" placeholder="Find a great idea..." className="search-input" />
            </div>
        </Layout>
    );
}