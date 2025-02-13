import { useState, useEffect } from 'react'


const Home = () => {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:8000')
                const result = await response.json()
                setData(result)
            } catch (error) {
                console.error('Error fetching data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])
    return (
        <>
            <div>
                <p>
                    {loading ? 'Loading...' : data.message}
                </p>
            </div>
        </>
    )
}
export default Home;