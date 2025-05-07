const { describe, it } = require('mocha');
const axios = require('axios');
const chai = require('chai');
const expect = chai.expect;
const FormData = require('form-data');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const CREATE_TASK_URL = process.env.CREATE_TASK_URL
const QUERY_TASK_URL = process.env.QUERY_TASK_URL

// --- IMPORTANT: Replace these with actual paths to your test files ---
const sourceImagePath = './src/assets/image.png'; // Example: './test_files/source.png'
const targetVideoPath = './src/assets/video.mp4'; // Example: './test_files/target.mp4'

let outputPathFromCreateTask; // To store the output_path from the create task response

describe('Face Fusion API Tests', function() {
    // Set a longer timeout if tasks take time to process
    this.timeout(30000); // 30 seconds timeout for the whole suite

    describe('1. Create Task API', function() {
        it('should successfully create a face fusion task and return an output_path', async function() {
            if (!fs.existsSync(sourceImagePath) || !fs.existsSync(targetVideoPath)) {
                this.skip(); // Skip test if files don't exist
                console.warn(`Skipping "Create Task" test: Test files not found at ${sourceImagePath} or ${targetVideoPath}. Please update paths.`);
                return;
            }

            const formData = new FormData();
            formData.append('source', fs.createReadStream(sourceImagePath)); // [cite: 4]
            formData.append('target', fs.createReadStream(targetVideoPath)); // [cite: 4]

            try {
                const response = await axios.post(CREATE_TASK_URL, formData, {
                    headers: {
                        ...formData.getHeaders()
                    }
                });

                expect(response.status).to.equal(200);
                expect(response.data).to.be.an('object');
                expect(response.data).to.have.property('output_path'); // [cite: 2]
                expect(response.data.output_path).to.be.a('string');

                outputPathFromCreateTask = response.data.output_path;
                console.log('Create Task - Success. Output Path:', outputPathFromCreateTask);
            } catch (error) {
                console.error('Create Task - Error:', error.response ? error.response.data : error.message);
                throw error; // Fail the test
            }
        });
    });

    describe('2. Query Task Result API', function() {
        before(function() {
            if (!outputPathFromCreateTask) {
                this.skip(); // Skip all "Query Task Result" tests if output_path wasn't obtained
                console.warn('Skipping "Query Task Result" tests: output_path not available from "Create Task" test.');
            }
        });

        it('should return 202 if task is still processing', async function() {
            // This test assumes the task might still be processing immediately after creation.
            // In a real-world scenario, you might need a delay or a polling mechanism.
            try {
                const response = await axios.post(QUERY_TASK_URL, {
                    output_path: outputPathFromCreateTask // [cite: 9]
                }, {
                    headers: { 'Content-Type': 'application/json' }
                });

                // Depending on how fast the processing is, this might be 200 or 202
                if (response.status === 202) {
                    expect(response.data).to.be.an('object');
                    expect(response.data.status).to.equal('processing'); // [cite: 12]
                    expect(response.data.message).to.equal('任务正在进行中,请稍后再试'); // [cite: 12]
                    console.log('Query Task - Status 202: Processing');
                } else if (response.status === 200) {
                    console.log('Query Task - Status 200: Task completed too quickly for 202 check, proceeding to file check.');
                    expect(response.headers['content-type']).to.match(/video\/mp4|image\/(png|jpeg|jpg)/); // [cite: 17, 18]
                } else {
                    // If it's another status, let the assertion fail to indicate an unexpected state.
                    expect.fail(`Expected status 202 or 200, but got ${response.status}`);
                }

            } catch (error) {
                 if (error.response) {
                    if (error.response.status === 202) { // API might return 202 as an "error" in axios if not handled
                        expect(error.response.data).to.be.an('object');
                        expect(error.response.data.status).to.equal('processing'); // [cite: 12]
                        expect(error.response.data.message).to.equal('任务正在进行中,请稍后再试'); // [cite: 12]
                        console.log('Query Task - Status 202 (via catch): Processing');
                        return;
                    }
                    console.error('Query Task (Processing Check) - Error:', error.response.data);
                } else {
                    console.error('Query Task (Processing Check) - Error:', error.message);
                }
                throw error;
            }
        });

        it('should eventually return 200 OK with file if task is successful (requires polling or delay)', async function() {
            this.timeout(180000); // Longer timeout for this test (3 minutes) to allow processing
            let attempts = 0;
            const maxAttempts = 15; // Poll 15 times
            const delayMs = 10000; // Wait 10 seconds between attempts

            while (attempts < maxAttempts) {
                attempts++;
                console.log(`Query Task (File Download) - Attempt ${attempts}/${maxAttempts}...`);
                try {
                    const response = await axios.post(QUERY_TASK_URL, {
                        output_path: outputPathFromCreateTask // [cite: 9]
                    }, {
                        headers: { 'Content-Type': 'application/json' },
                        responseType: 'arraybuffer' // Important for receiving binary file data
                    });

                    if (response.status === 200) {
                        expect(response.headers['content-type']).to.be.a('string');
                        // Check for common video or image content types based on documentation [cite: 17, 18]
                        expect(response.headers['content-type']).to.match(/video\/mp4|image\/(png|jpeg|jpg)/);
                        expect(response.data).to.be.instanceOf(ArrayBuffer); // Check if we received binary data
                        console.log('Query Task - Status 200: File received. Content-Type:', response.headers['content-type']);
                        // Optionally, save the file to verify
                        // const extension = response.headers['content-type'].split('/')[1];
                        // fs.writeFileSync(`./downloaded_result.${extension}`, Buffer.from(response.data));
                        // console.log(`File saved as downloaded_result.${extension}`);
                        return; // Test passed
                    }
                } catch (error) {
                    if (error.response && error.response.status === 202) {
                        // Task still processing, wait and retry
                        console.log('Query Task - Status 202: Still processing, will retry...');
                        await new Promise(resolve => setTimeout(resolve, delayMs));
                    } else if (error.response && error.response.status === 500) {
                         const responseData = JSON.parse(Buffer.from(error.response.data).toString('utf8'));
                         expect(responseData.status).to.equal('error');
                         expect(responseData.message).to.equal('文件生成失败'); // [cite: 12]
                         console.error('Query Task - Status 500: File generation failed.');
                         throw new Error('Task failed with 500: File generation error.');
                    }
                    else {
                        console.error('Query Task (File Download) - Error:', error.response ? JSON.parse(Buffer.from(error.response.data).toString('utf8')) : error.message);
                        throw error; // Other unexpected error
                    }
                }
            }
            throw new Error('Task did not complete successfully within the polling time.');
        });

        it('should return 400 Bad Request if output_path is missing', async function() {
            try {
                await axios.post(QUERY_TASK_URL, {}, { // Empty body
                    headers: { 'Content-Type': 'application/json' }
                });
                expect.fail('Expected API to return 400 Bad Request');
            } catch (error) {
                expect(error.response).to.not.be.undefined;
                expect(error.response.status).to.equal(400);
                expect(error.response.data).to.be.an('object');
                expect(error.response.data.status).to.equal('error');
                expect(error.response.data.message).to.equal('未提供 output_path'); // [cite: 11]
                console.log('Query Task - Status 400: output_path missing (Correct)');
            }
        });

        it('should return 404 Not Found if output_path does not correspond to any task', async function() {
            const nonExistentPath = '/tmp/nonexistent/path.mp4';
            try {
                await axios.post(QUERY_TASK_URL, {
                    output_path: nonExistentPath // [cite: 9]
                }, {
                    headers: { 'Content-Type': 'application/json' }
                });
                expect.fail('Expected API to return 404 Not Found');
            } catch (error) {
                expect(error.response).to.not.be.undefined;
                expect(error.response.status).to.equal(404);
                expect(error.response.data).to.be.an('object');
                expect(error.response.data.status).to.equal('error');
                expect(error.response.data.message).to.equal('未创建相关任务'); // [cite: 11]
                console.log('Query Task - Status 404: Task not found (Correct)');
            }
        });

        // Test for 500 Internal Server Error (File generation failed)
        // This is harder to reliably trigger without specific server-side conditions.
        // The "should eventually return 200 OK" test implicitly covers a 500 if the server returns it during polling.
        // You could add a dedicated test if you have a way to force a file generation failure.
        // For example, if a specific output_path is known to cause a failure:
        it('should return 500 Internal Server Error if file generation fails', async function() {
            const knownToFailPath = '/tmp/known_to_fail_path.mp4'; // Replace if you have such a path
            try {
                await axios.post(QUERY_TASK_URL, {
                    output_path: knownToFailPath
                }, {
                    headers: { 'Content-Type': 'application/json' }
                });
                expect.fail('Expected API to return 500 Internal Server Error');
            } catch (error) {
                expect(error.response).to.not.be.undefined;
                expect(error.response.status).to.equal(500);
                expect(error.response.data).to.be.an('object');
                expect(error.response.data.status).to.equal('error');
                expect(error.response.data.message).to.equal('文件生成失败'); // [cite: 12]
                console.log('Query Task - Status 500: File generation failed (Correct)');
            }
        });
    });
});