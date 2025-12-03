import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

export default defineConfig(({ mode }) => {
    // Load environment variables from .env file
    // loadEnv(mode, rootDir, prefix) - empty prefix '' berarti load semua vars tanpa prefix
    // Menggunakan '.' sebagai root directory (relative to vite.config.ts)
    const env = loadEnv(mode, '.', '');
    
    // Debug: Log loaded env vars untuk troubleshooting
    const apiKeyValue = env.GEMINI_API_KEY || env.API_KEY || '';
    console.log('📋 Vite Config - Environment Variables:');
    console.log('  Mode:', mode);
    console.log('  GEMINI_API_KEY:', env.GEMINI_API_KEY ? `✅ Found (${env.GEMINI_API_KEY.substring(0, 10)}...)` : '❌ Not found');
    console.log('  API_KEY:', env.API_KEY ? '✅ Found' : '❌ Not found');
    console.log('  Final API Key:', apiKeyValue ? `✅ Will be used` : '⚠️ WARNING: No API key found, using fallback!');
    
    return {
      // Base path untuk GitHub Pages (repository name: api)
      base: mode === 'production' ? '/api/' : '/',
      server: {
        port: 3000,
        host: '0.0.0.0',
        // Middleware untuk write file ke data/predictions/
        middlewareMode: false,
        fs: {
          // Allow access to project root
          allow: ['..'],
        },
      },
      plugins: [
        react(),
        // Custom plugin untuk handle write file
        {
          name: 'write-file-plugin',
          configureServer(server) {
            server.middlewares.use('/api/write-file', async (req, res, next) => {
              if (req.method !== 'POST') {
                return next();
              }

              try {
                let body = '';
                req.on('data', chunk => {
                  body += chunk.toString();
                });

                req.on('end', async () => {
                  try {
                    const { filename, content } = JSON.parse(body);
                    
                    // Pastikan folder data/predictions/ ada
                    const predictionsDir = path.resolve(__dirname, 'data', 'predictions');
                    if (!fs.existsSync(predictionsDir)) {
                      fs.mkdirSync(predictionsDir, { recursive: true });
                    }

                    // Write file
                    const filePath = path.join(predictionsDir, filename);
                    fs.writeFileSync(filePath, content, 'utf-8');

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, message: `File ${filename} berhasil ditulis` }));
                  } catch (error) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }));
                  }
                });
              } catch (error) {
                next();
              }
            });

            // API endpoint untuk list semua file JSON di folder
            server.middlewares.use('/api/list-files', async (req, res, next) => {
              if (req.method !== 'GET') {
                return next();
              }

              try {
                const predictionsDir = path.resolve(__dirname, 'data', 'predictions');
                
                if (!fs.existsSync(predictionsDir)) {
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: true, files: [] }));
                  return;
                }

                // Read semua file JSON di folder
                const files = fs.readdirSync(predictionsDir)
                  .filter(file => file.endsWith('.json'))
                  .map(file => {
                    const filePath = path.join(predictionsDir, file);
                    const stats = fs.statSync(filePath);
                    return {
                      name: file,
                      size: stats.size,
                      modified: stats.mtime.toISOString(),
                    };
                  })
                  .sort((a, b) => {
                    // Sort by modified time (newest first)
                    return new Date(b.modified).getTime() - new Date(a.modified).getTime();
                  });

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, files }));
              } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }));
              }
            });

            // API endpoint untuk update kesimpulan pada file JSON yang sudah ada
            server.middlewares.use('/api/update-kesimpulan', async (req, res, next) => {
              if (req.method !== 'POST') {
                return next();
              }

              try {
                let body = '';
                req.on('data', chunk => {
                  body += chunk.toString();
                });

                req.on('end', async () => {
                  try {
                    const { filename } = JSON.parse(body);
                    
                    // Parse query parameter untuk trafficType
                    let requestedTrafficType: 'PASSENGER' | 'FLIGHT' = 'PASSENGER';
                    if (req.url) {
                      const urlParts = req.url.split('?');
                      if (urlParts.length > 1) {
                        const params = new URLSearchParams(urlParts[1]);
                        if (params.get('trafficType') === 'FLIGHT') {
                          requestedTrafficType = 'FLIGHT';
                        }
                      }
                    }
                    
                    const predictionsDir = path.resolve(__dirname, 'data', 'predictions');
                    const filePath = path.join(predictionsDir, filename);
                    
                    if (!fs.existsSync(filePath)) {
                      res.writeHead(404, { 'Content-Type': 'application/json' });
                      res.end(JSON.stringify({ success: false, error: 'File not found' }));
                      return;
                    }

                    // Read existing file
                    const fileContent = fs.readFileSync(filePath, 'utf-8');
                    const parsedData = JSON.parse(fileContent);
                    
                    // Always regenerate kesimpulan (remove old one if exists)
                    // This ensures we always get the latest format and shorter version

                    // Parse predictions array (handle both old and new format)
                    let predictionsArray: any[] = [];
                    if (parsedData.predictions && Array.isArray(parsedData.predictions)) {
                      predictionsArray = parsedData.predictions;
                    } else if (Array.isArray(parsedData)) {
                      predictionsArray = parsedData;
                    } else {
                      res.writeHead(400, { 'Content-Type': 'application/json' });
                      res.end(JSON.stringify({ success: false, error: 'Invalid file format' }));
                      return;
                    }

                    // Separate passenger and flight predictions
                    const passengerPredictions = predictionsArray.filter((p: any) => p.requestType === 'PASSENGER');
                    const flightPredictions = predictionsArray.filter((p: any) => p.requestType === 'FLIGHT');

                    if (passengerPredictions.length === 0 && flightPredictions.length === 0) {
                      res.writeHead(400, { 'Content-Type': 'application/json' });
                      res.end(JSON.stringify({ success: false, error: 'No predictions found' }));
                      return;
                    }

                    // Import generateKesimpulan function
                    const { generateKesimpulan } = await import('./services/geminiService');
                    const { getAirportData } = await import('./data/nataruData');
                    
                    const firstPred = predictionsArray[0];
                    const airportCode = firstPred.airportCode || 'ALL';
                    const baselineData = getAirportData(airportCode);

                    // Convert to BatchPredictionResult format
                    const passengerBatch = passengerPredictions.length > 0 ? {
                      predictions: passengerPredictions.map((p: any) => ({
                        predictedValue: p.predictedValue,
                        confidence: p.confidence,
                        reasoning: p.reasoning,
                        comprehensiveAnalysis: p.comprehensiveAnalysis,
                        context: p.context,
                        airportCode: p.airportCode,
                        sources: p.sources || [],
                        appliedScenario: p.appliedScenario,
                        detectedEvent: p.detectedEvent,
                        date: p.date,
                      })),
                      airportCode: airportCode,
                      trafficType: 'PASSENGER' as const,
                      scenario: firstPred.requestScenario || 'AUTO',
                      generatedAt: firstPred.savedAt || new Date().toISOString(),
                    } : null;

                    const flightBatch = flightPredictions.length > 0 ? {
                      predictions: flightPredictions.map((p: any) => ({
                        predictedValue: p.predictedValue,
                        confidence: p.confidence,
                        reasoning: p.reasoning,
                        comprehensiveAnalysis: p.comprehensiveAnalysis,
                        context: p.context,
                        airportCode: p.airportCode,
                        sources: p.sources || [],
                        appliedScenario: p.appliedScenario,
                        detectedEvent: p.detectedEvent,
                        date: p.date,
                      })),
                      airportCode: airportCode,
                      trafficType: 'FLIGHT' as const,
                      scenario: firstPred.requestScenario || 'AUTO',
                      generatedAt: firstPred.savedAt || new Date().toISOString(),
                    } : null;

                    // Generate kesimpulan berdasarkan trafficType yang diminta
                    const kesimpulan = await generateKesimpulan(
                      passengerBatch,
                      flightBatch,
                      baselineData,
                      requestedTrafficType
                    );

                    // Update file with kesimpulan
                    const updatedData = {
                      predictions: predictionsArray,
                      kesimpulan: kesimpulan,
                      metadata: parsedData.metadata || {
                        airportCode: airportCode,
                        generatedAt: firstPred.savedAt || new Date().toISOString(),
                        passengerCount: passengerPredictions.length,
                        flightCount: flightPredictions.length,
                        version: '2.0'
                      }
                    };

                    // Write updated file
                    fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2), 'utf-8');

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, message: 'Kesimpulan berhasil ditambahkan', kesimpulan }));
                  } catch (error) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }));
                  }
                });
              } catch (error) {
                next();
              }
            });
          },
        },
      ],
      define: {
        // Inject environment variables untuk digunakan di client-side
        // Vite akan mengganti semua referensi process.env.API_KEY dengan nilai dari env
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY || ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY || ''),
        // Juga expose via global untuk akses lebih mudah
        '__GEMINI_API_KEY__': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
