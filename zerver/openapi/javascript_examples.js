const ExamplesHandler = function () {
    const config = {
        username: process.env.ZULIP_USERNAME,
        apiKey: process.env.ZULIP_API_KEY,
        realm: process.env.ZULIP_REALM,
    };
    const examples = {};
    const response_data = [];

    const make_result_object = (example, result, count = false) => {
        const name = count !== false ? `${example.name}_${count}` : example.name;
        return {
            name,
            endpoint: example.endpoint.split(':')[0],
            method: example.endpoint.split(':')[1],
            status_code: example.status_code.toString(),
            result,
        };
    };

    const generate_validation_data = async (client, example) => {
        const result = await example.func(client);
        if (Array.isArray(result)) {
            // Handle special cases where some examples make
            // more than 1 API requests.
            result.forEach((r, index) => {
                response_data.push(make_result_object(example, r, index));
            });
        } else {
            response_data.push(make_result_object(example, result));
        }
    };

    const main = async () => {
        const Zulip = require('zulip-js');
        const client = await Zulip(config);

        await generate_validation_data(client, examples.send_message);
        await generate_validation_data(client, examples.create_user);
        await generate_validation_data(client, examples.get_custom_emoji);
        await generate_validation_data(client, examples.delete_queue);
        await generate_validation_data(client, examples.get_messages);
        await generate_validation_data(client, examples.get_own_user);
        await generate_validation_data(client, examples.get_stream_id);
        await generate_validation_data(client, examples.get_stream_topics);
        await generate_validation_data(client, examples.get_subscriptions);
        await generate_validation_data(client, examples.get_users);
        await generate_validation_data(client, examples.register_queue);

        console.log(JSON.stringify(response_data));
        return;
    };

    const add_example = (name, endpoint, status_code, func) => {
        const example = {
            name,
            endpoint,
            status_code,
            func,
        };
        examples[name] = example;
    };

    return {
        main,
        add_example,
    };
};

const {main, add_example} = ExamplesHandler();

// Declare all the examples below.

add_example('send_message', '/messages:post', 200, async (client) => {
    // {code_example|start}
    // Send a stream message
    let params = {
        to: 'social',
        type: 'stream',
        topic: 'Castle',
        content: 'I come not, friends, to steal away your hearts.',
    };
    const result_1 = await client.messages.send(params);
    // {code_example|end}

    // {code_example|start}
    // Send a private message
    const user_id = 9;
    params = {
        to: [user_id],
        type: 'private',
        content: 'With mirth and laughter let old wrinkles come.',
    };
    const result_2 = await client.messages.send(params);
    // {code_example|end}
    return [result_1, result_2];
});

add_example('create_user', '/users:post', 200, async (client) => {
    // {code_example|start}
    const params = {
        email: 'notnewbie@zulip.com',
        password: 'temp',
        full_name: 'New User',
        short_name: 'newbie',
    };

    return await client.users.create(params);
    // {code_example|end}
});

add_example('get_custom_emoji', '/realm/emoji:get', 200, async (client) => {
    // {code_example|start}
    return await client.emojis.retrieve();
    // {code_example|end}
});

add_example('delete_queue', '/events:delete', 200, async (client) => {
    // {code_example|start}
    // Register a queue
    const queueParams = {
        event_types: ['message'],
    };
    const res = await client.queues.register(queueParams);

    // Delete a queue
    const deregisterParams = {
        queue_id: res.queue_id,
    };

    return await client.queues.deregister(deregisterParams);
    // {code_example|end}
});

add_example('get_messages', '/messages:get', 200, async (client) => {
    // {code_example|start}
    const readParams = {
        anchor: 'newest',
        num_before: 100,
        num_after: 0,
        narrow: [{operator: 'sender', operand: 'iago@zulip.com'},
                 {operator: 'stream', operand: 'Verona'}],
    };

    // Get the 100 last messages sent by "iago@zulip.com" to the stream "Verona"
    return await client.messages.retrieve(readParams);
    // {code_example|end}
});

add_example('get_own_user', '/users/me:get', 200, async (client) => {
    // {code_example|start}
    // Get the profile of the user/bot that requests this endpoint,
    // which is `client` in this case:
    return await client.users.me.getProfile();
    // {code_example|end}
});

add_example('get_stream_id', '/get_stream_id:get', 200, async (client) => {
    // {code_example|start}
    // Get the ID of a given stream
    return await client.streams.getStreamId('Denmark');
    // {code_example|end}
});

add_example('get_stream_topics', '/users/me/{stream_id}/topics:get', 200, async (client) => {
    // {code_example|start}
    // Get all the topics in stream with ID 1
    return client.streams.topics.retrieve({ stream_id: 1 });
    // {code_example|end}
});

add_example('get_subscriptions', '/users/me/subscriptions:get', 200, async (client) => {
    // {code_example|start}
    // Get all streams that the user is subscribed to
    return await client.streams.subscriptions.retrieve();
    // {code_example|end}
});

add_example('get_users', '/users:get', 200, async (client) => {
    // {code_example|start}
    // Get all users in the realm
    const result_1 = await client.users.retrieve();
    // {code_example|end}

    // {code_example|start}
    // You may pass the `client_gravatar` query parameter as follows:
    const result_2 = await client.users.retrieve({client_gravatar: true});
    // {code_example|end}
    return [result_1, result_2];
});

add_example('register_queue', '/register:post', 200, async (client) => {
    // {code_example|start}
    // Register a queue
    const params = {
        event_types: ['message'],
    };

    return await client.queues.register(params);
    // {code_example|end}
});

main();
