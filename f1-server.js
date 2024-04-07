const express = require('express');
const supa = require('@supabase/supabase-js');
const app = express();

const supaUrl = 'https://udqgizlemvyeaqpcmuek.supabase.co';
const supaAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkcWdpemxlbXZ5ZWFxcGNtdWVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDg3NDgwMDksImV4cCI6MjAyNDMyNDAwOX0.03Sd49AoRHPCI3oJ77KZFnr010ZTaGuSqAo2LkakImM';

const supabase = supa.createClient(supaUrl, supaAnonKey);

// Enable CORS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  });

//returns all the seasons
app.get('/api/seasons', async (req, res) => {
    const {data, error} = await supabase
    .from('seasons')
    .select('*')
    res.send(data);
})

//returns all the circuits
app.get('/api/circuits', async (req, res) => {
    const {data, error} = await supabase
    .from('circuits')
    .select('*')
    res.send(data);
})

//returns specific circuit
app.get('/api/circuits/:ref', async (req, res) => {
    const {data, error} = await supabase
    .from('circuits')
    .select('*')
    .eq('circuitRef', req.params.ref)
    if (!handleNotFound(res, data, 'circuit not found!')) {
        res.send(data);
    }
})

//returns circuit with specific season
app.get('/api/circuits/season/:year', async (req, res) => {
    const { data, error } = await supabase
    .from('races')
    .select('round, circuits (circuitId, circuitRef, name, location, country, lat, lng, alt, url)')
    .eq('year', req.params.year)
    .order('round', {ascending: true});
    if (!handleNotFound(res, data, 'circuit year does not exist!')) {
        res.send(data);
    }
})

//returns all constructors
app.get('/api/constructors', async (req, res) => {
    const {data, error} = await supabase
    .from('constructors')
    .select('*')
    res.send(data);
})

//returns specific constructor
app.get('/api/constructors/:ref', async (req, res) => {
    const {data, error} = await supabase
    .from('constructors')
    .select('*')
    .eq('constructorRef', req.params.ref);
    if (!handleNotFound(res, data, 'constructor not found!')) {
        res.send(data);
    }
})

//does not work
//https://supabase.com/docs/reference/javascript/single
app.get('/api/constructors/season/:year', async (req, res) => {
    //fetches the raceId for the specified year from the races table
    const {data: seasonData, error: seasonError} = await supabase
    .from('races')
    .select('raceId')
    .eq('year', req.params.year)
    .single();

    //if error or no data is returned, handles the case where the year is not found
    if (seasonError || !seasonData) {
        return handleNotFound(res, null, 'year not found!');
    }

    //fetches the constructorId from constructorStandings table based on the fetched raceId
    const {data: constructorData, error: constructorError} = await supabase
    .from('constructorStandings')
    .select('constructorId')
    .eq('raceId', seasonData.raceId)
    .single();

    //if error or no data is returned, handles the case where the constructor is not found
    if (constructorError || !constructorData) {
        return handleNotFound(res, null, 'constructor not found!');
    }

    // fetches the details of the constructor using the fetched constructorId
    const {data: constData, error: constError} = await supabase
    .from('constructors')
    .select("*")
    .eq('constructorId', constructorData.constructorId)

    //if error or no data is returned, handles the case where the constructor is not found
    if (constError || !constData) {
        return handleNotFound(res,null, 'constructor not found!');
    }
    //sends the constructor data as the response
    res.send(constData);


})

//returns all the drivers
app.get('/api/drivers', async (req, res) => {
    const {data, error} = await supabase
    .from('drivers')
    .select('*')
    if (!handleNotFound(res, data, 'constructor not found!')) {
        res.send(data);
    }
})

//returns specific driver
app.get('/api/drivers/:ref', async (req, res) => {
    const {data, error} = await supabase
    .from('drivers')
    .select('*')
    .eq('driverRef', req.params.ref)
    if (!handleNotFound(res, data, 'driver not found!')) {
        res.send(data);
    }
})

//returns drivers whose surnames start with specified substring
app.get('/api/drivers/search/:substring', async (req, res) => {
    const {data, error} = await supabase
    .from('drivers')
    .select('*')
    .ilike('surname', `${req.params.substring}%`)
    if (!handleNotFound(res, data, 'driver not found!')) {
        res.send(data);
    }
})

//does not work
app.get('/api/drivers/season/:year', async (req, res) => {
    //fetches the raceId for the specified year from the races table
    const { data: raceData, error: raceError } = await supabase
    .from('races')
    .select('raceId')
    .eq('year', req.params.year)
    .single();

    if (raceError || ! raceData) {
        return handleNotFound(res, null, 'race not found!');
    }

    //fetches the driverId from driverStandings table based on the fetched raceId
    const {data: standingsData, error: standingsError} = await supabase
    .from('driverStandings')
    .select('driverId')
    .eq('raceId', raceData.raceId)
    .single();

    if (standingsError || !standingsData) {
        return handleNotFound(res, null, 'race not found!');
    }

    //fetches the details of the driver using the fetched driverId
    const {data: driverData, error: driverError} = await supabase
    .from('drivers')
    .select('*')
    .eq('driverId', standingsData.driverId)

    if (driverError || !driverData) {
        return handleNotFound(res, null, 'driver not found!');
    }
    res.send(driverData);
});

//returns drivers in specific race
app.get('/api/drivers/race/:raceId', async (req, res) => {
    const {data, error} = await supabase
    .from('driverStandings')
    .select('drivers(*)')
    .eq('raceId', req.params.raceId)
    if (!handleNotFound(res, data, 'driver not found!')) {
        res.send(data);
    }
})

//returns specific race
app.get('/api/races/:raceId', async (req, res) => {
    const {data, error} = await supabase
    .from('races')
    .select('raceId, year, round, name, date, time, url,circuits (name, location, country)')
    .eq('raceId', req.params.raceId)
    if (!handleNotFound(res, data, 'race not found!')) {
        res.send(data);
    }
})

//returns races in specific season
app.get('/api/races/season/:year', async (req,res) => {
    const {data, error} = await supabase
    .from('races')
    .select('*')
    .eq('year', req.params.year)
    .order('round', {ascending: true})
    if (!handleNotFound(res, data, 'race not found!')) {
        res.send(data);
    }
})

//returns specific race in a specific season
app.get('/api/races/season/:year/:round', async (req, res) => {
    const {data, error} = await supabase
    .from('races')
    .select('*')
    .eq('year', req.params.year)
    .eq('round', req.params.round)
    if (!handleNotFound(res, data, 'race not found!')) {
        res.send(data);
    }
})

//returns all races in specific circuit
app.get('/api/races/circuits/:ref', async (req, res) => {
    const { data: circuitData, error: circuitError } = await supabase
        .from('circuits')
        .select('circuitId')
        .eq('circuitRef', req.params.ref)
        .single();

    if (circuitError || !circuitData) {
        return handleNotFound(res, null, 'circuit not found!');
    }

    const { data: raceData, error: raceError } = await supabase
        .from('races')
        .select('*')
        .eq('circuitId', circuitData.circuitId)
        .order('year', { ascending: true });

    if (raceError || !raceData) {
        return handleNotFound(res, null, 'race not found!');
    }

    res.send(raceData);
});

//returns all races in specific circuit between two years
app.get('/api/races/circuits/:ref/season/:start/:end', async (req, res) => {
    const { data: circuitData, error: circuitError } = await supabase
        .from('circuits')
        .select('circuitId')
        .eq('circuitRef', req.params.ref)
        .single();

    if (circuitError || !circuitData) {
        return handleNotFound(res, null, 'circuit not found!');
    }

    if (req.params.start >= req.params.end) {
        return handleNotFound(res, null, 'start cannot be greater than end');
    }

    const { data: raceData, error: raceError } = await supabase
        .from('races')
        .select('*')
        .eq('circuitId', circuitData.circuitId)
        .gte('date', req.params.start)  // filter races starting from the specified start date
        .lte('date', req.params.end)    // filter races ending before or on the specified end date
        .order('year', { ascending: true });

    if (raceError || !raceData) {
        return handleNotFound(res, data, 'races not found within the specified date range!');
    }

    res.send(raceData);
});

//returns results of specific race
app.get('/api/results/:raceId', async (req,res) => {
    const {data, error} = await supabase
    .from('results')
    .select('position, drivers(driverRef, code, forename, surname), races(name, round, year, date), constructors(name, constructorRef, nationality)')
    .eq('raceId', req.params.raceId)
    .order('grid', {ascending: true})
    if (!handleNotFound(res, data, 'results not found!')) {
        res.send(data);
    }
})

//returns all results for specific driver
app.get('/api/results/driver/:ref', async (req, res) => {
    const {data, error} = await supabase
    .from('drivers')
    .select('results(*)')
    .eq('driverRef', req.params.ref)
    if (!handleNotFound(res, data, 'results not found!')) {
        res.send(data);
    }
})

//returns all results for specific driver between two years
app.get('/api/results/drivers/:ref/seasons/:start/:end', async (req, res) => {
    const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('*')
        .eq('driverRef', req.params.ref)
        .single();

    if (driverError || !driverData) {
        return handleNotFound(res, data, 'drivers not found!');
    }

    const { data: raceData, error: raceError } = await supabase
        .from('races')
        .select('raceId')
        .gte('date', req.params.start)
        .lte('date', req.params.end);

    if (raceError || !raceData || raceData.length === 0) {
        return handleNotFound(res, data, 'racesnot found!');
    }

    const startYear = parseInt(req.params.start);
    const endYear = parseInt(req.params.end);

    if (startYear >= endYear) {
        return handleNotFound(res, data, 'start cannot be greater than end!');
    }

    const raceIds = raceData.map(race => race.raceId);

    const { data: resultsData, error: resultsError } = await supabase
        .from('results')
        .select('*')
        .eq('driverId', driverData.driverId)
        .in('raceId', raceIds);

    if (resultsError || !resultsData || resultsData.length === 0) {
        return handleNotFound(res, data, 'drivers not found!');
    }

    res.send(resultsData);
});

//returns qualifying results for specific race
app.get('/api/qualifying/:raceId', async (req, res) => {
    const {data, error} = await supabase
    .from('qualifying')
    .select('position, drivers(driverRef, code, forename, surname), races(name, round, year, date), constructors(name, constructorRef, nationality)')
    .eq('raceId', req.params.raceId)
    .order('position', {ascending: true})
    if (!handleNotFound(res, data, 'qualifying results not found!')) {
        res.send(data);
    }
})

//returns current season driver standings for specific race
app.get('/api/standings/drivers/:raceId', async (req,res) => {
    const {data, error} = await supabase
    .from('driverStandings')
    .select('position, drivers(driverRef, code, forename, surname), wins, points')
    .eq('raceId', req.params.raceId)
    if (!handleNotFound(res, data, 'standings table not found!')) {
        res.send(data);
    }
})


//returns current seasons constructor standings for specific race
app.get('/api/standings/constructors/:raceId', async (req, res) => {
    const {data, error} = await supabase
    .from('constructorStandings')
    .select('position, constructors(name, constructorRef, nationality), points, wins')
    .eq('raceId', req.params.raceId)
    .order('position', {ascending: true})
    if (!handleNotFound(res, data, 'constructors standings not found!')) {
        res.send(data);
    }
})

//handles not found parameters
function handleNotFound(res, data, message) {
    if (data === null || data.length === 0) {
        res.status(404).json({ message });
        return true;
    }
    return false;
}

//console.log('http://localhost:8080/api/');
app.listen(8080, () => {
    console.log('listening on port 8080');
    console.log('http://localhost:8080/api/seasons');
    console.log('http://localhost:8080/api/circuits');
    console.log('http://localhost:8080/api/circuits/monaco');
    console.log('http://localhost:8080/api/circuits/dhdfh');
    console.log('http://localhost:8080/api/circuits/season/2020');
    console.log('http://localhost:8080/api/circuits/season/2500');
    console.log('http://localhost:8080/api/constructors');
    console.log('http://localhost:8080/api/constructors/mclaren');
    console.log('http://localhost:8080/api/constructors/mcledfej');
    //not working
    console.log('http://localhost:8080/api/constructors/season/2020')
    console.log('http://localhost:8080/api/drivers');
    console.log('http://localhost:8080/api/drivers/hamilton');
    console.log('http://localhost:8080/api/drivers/hfiunefi');
    console.log('http://localhost:8080/api/drivers/search/sch');
    console.log('http://localhost:8080/api/drivers/search/8383');
    //not working
    console.log('http://localhost:8080/api/drivers/season/2022');
    console.log('http://localhost:8080/api/drivers/race/1106');
    console.log('http://localhost:8080/api/drivers/race/9999');
    console.log('http://localhost:8080/api/races/1106');
    console.log('http://localhost:8080/api/races/9999');
    console.log('http://localhost:8080/api/races/season/2020');
    console.log('http://localhost:8080/api/races/season/2500');
    console.log('http://localhost:8080/api/races/season/2022/4');
    console.log('http://localhost:8080/api/races/season/2049/80');
    console.log('http://localhost:8080/api/races/circuits/monza');
    console.log('http://localhost:8080/api/races/circuits/monza/season/2015/2020');
    console.log('http://localhost:8080/api/races/circuits/monza/season/2020/2020');
    console.log('http://localhost:8080/api/results/1106');
    console.log('http://localhost:8080/api/results/38837');
    console.log('http://localhost:8080/api/results/driver/max_verstappen');
    console.log('http://localhost:8080/api/results/driver/domohaha');
    console.log('http://localhost:8080/api/results/drivers/sainz/seasons/2021/2022');
    console.log('http://localhost:8080/api/qualifying/1106');
    console.log('http://localhost:8080/api/qualifying/343823');
    console.log('http://localhost:8080/api/standings/drivers/1120');
    console.log('http://localhost:8080/api/standings/constructors/1120');
    console.log('http://localhost:8080/api/standings/constructors/asds');
});