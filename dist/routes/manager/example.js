export default (router) => {
    router.get('/manager/example', async (req, res) => {
        res.status(200).send('All good my dude');
    });
    return router;
};
