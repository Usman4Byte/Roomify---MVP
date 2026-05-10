import { useLocation, useNavigate, useOutletContext, useParams} from "react-router";
import {useEffect, useRef, useState} from "react";
import { generate3DView, getOpenRouterApiKey, setOpenRouterApiKey } from "../../lib/ai.action";
import {Box, Download, RefreshCcw, Share2, X} from "lucide-react";
import Button from "../../components/ui/Button";
import { createProject, getProjectById } from "../../lib/app.actions";
import {ReactCompareSlider, ReactCompareSliderImage} from "react-compare-slider";

const VisualizerId = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { userId } = useOutletContext<AuthContext>()

    const hasInitialGenerated = useRef(false);

    const [project, setProject] = useState<DesignItem | null>(null);
    const [isProjectLoading, setIsProjectLoading] = useState(true);

    const [isProcessing, setIsProcessing] = useState(false);
    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const [openRouterKey, setOpenRouterKeyState] = useState("");
    const [isKeySaved, setIsKeySaved] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);
    const [generationError, setGenerationError] = useState<string | null>(null);

    const handleBack = () => navigate('/');
    const handleExport = () => {
        if (!currentImage) return;

        const link = document.createElement('a');
        link.href = currentImage;
        link.download = `roomzup-${id || 'design'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    const runGeneration = async (item: DesignItem) => {
        if(!id || !item.sourceImage) return;
        if (!getOpenRouterApiKey()) {
            window.alert("Add your OpenRouter API key to generate a render.");
            return;
        }

        try {
            setIsProcessing(true);
            setGenerationError(null);
            const result = await generate3DView({ sourceImage: item.sourceImage });

            if(result.renderedImage) {
                setCurrentImage(result.renderedImage);

                const updatedItem = {
                    ...item,
                    renderedImage: result.renderedImage,
                    renderedPath: result.renderedPath,
                    timestamp: Date.now(),
                    ownerId: item.ownerId ?? userId ?? null,
                    isPublic: item.isPublic ?? false,
                }

                const saved = await createProject({ item: updatedItem, visibility: "private" })

                if(saved) {
                    setProject(saved);
                    setCurrentImage(saved.renderedImage || result.renderedImage);
                }
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "Generation failed";
            setGenerationError(message);
            console.error('Generation failed: ', error)
        } finally {
            setIsProcessing(false);
        }
    }

    const handleSaveApiKey = () => {
        const trimmed = openRouterKey.trim();
        setOpenRouterApiKey(trimmed);
        setIsKeySaved(!!trimmed);
        setSaveMessage(trimmed ? "Key saved locally." : "Key removed from this browser.");
    };

    useEffect(() => {
        const existingKey = getOpenRouterApiKey();
        if (existingKey) {
            setOpenRouterKeyState(existingKey);
            setIsKeySaved(true);
        }
    }, []);

    useEffect(() => {
        if (!saveMessage) return;
        const timeout = window.setTimeout(() => setSaveMessage(null), 2200);
        return () => window.clearTimeout(timeout);
    }, [saveMessage]);

    useEffect(() => {
        let isMounted = true;

        const loadProject = async () => {
            if (!id) {
                setIsProjectLoading(false);
                return;
            }

            setIsProjectLoading(true);

            const fetchedProject = await getProjectById({ id });

            if (!isMounted) return;

            if (fetchedProject) {
                setProject(fetchedProject);
                setCurrentImage(fetchedProject.renderedImage || null);
            } else {
                const state = (location.state || {}) as VisualizerLocationState;
                if (state?.initialImage) {
                    const fallbackProject: DesignItem = {
                        id,
                        name: state.name || `Residence ${id}`,
                        sourceImage: state.initialImage,
                        renderedImage: state.initialRender || null,
                        timestamp: Date.now(),
                        ownerId: state.ownerId ?? userId ?? null,
                        isPublic: false,
                    };
                    setProject(fallbackProject);
                    setCurrentImage(fallbackProject.renderedImage || null);
                } else {
                    setProject(null);
                    setCurrentImage(null);
                }
            }

            setIsProjectLoading(false);
            hasInitialGenerated.current = false;
        };

        loadProject();

        return () => {
            isMounted = false;
        };
    }, [id, location.state, userId]);

    useEffect(() => {
        if (
            isProjectLoading ||
            hasInitialGenerated.current ||
            !project?.sourceImage
        )
            return;

        if (project.renderedImage) {
            setCurrentImage(project.renderedImage);
            hasInitialGenerated.current = true;
            return;
        }

        hasInitialGenerated.current = true;
        void runGeneration(project);
    }, [project, isProjectLoading]);

    return (
        <div className="visualizer">
            <nav className="topbar">
                <div className="brand">
                    <Box className="logo" />

                    <span className="name">Roomzup</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleBack} className="exit">
                    <X className="icon" /> Exit Editor
                </Button>
            </nav>

            <section className="content">
                <div className="panel">
                    <div className="panel-header">
                        <div className="panel-meta">
                            <p>Project</p>
                            <h2>{project?.name || `Residence ${id}`}</h2>
                            <p className="note">Created by You</p>
                        </div>

                        <div className="panel-actions">
                            <Button
                                size="sm"
                                onClick={handleExport}
                                className="export"
                                disabled={!currentImage}
                            >
                                <Download className="w-4 h-4 mr-2" /> Export
                            </Button>
                            <Button size="sm" onClick={() => {}} className="share">
                                <Share2 className="w-4 h-4 mr-2" />
                                Share
                            </Button>
                        </div>
                    </div>

                    <div className="api-key-card">
                        <div className="api-key-head">
                            <div>
                                <p className="eyebrow">OpenRouter API Key</p>
                                <h3>Connect your own AI credits</h3>
                                <p className="note">
                                    Your key is stored locally in this browser and used only for your renders.
                                </p>
                            </div>
                            <a
                                className="link"
                                href="https://openrouter.ai/keys"
                                target="_blank"
                                rel="noreferrer"
                            >
                                Get API Key
                            </a>
                        </div>

                        <div className="api-key-status">
                            <span className={`dot ${isKeySaved ? "is-live" : "is-empty"}`} />
                            <span>{isKeySaved ? "Key detected" : "No key saved"}</span>
                            {saveMessage && <span className="message">{saveMessage}</span>}
                        </div>

                        <ol className="api-key-steps">
                            <li>Open OpenRouter and create a key.</li>
                            <li>Paste the key below and click Save.</li>
                            <li>Upload a plan and generate your render.</li>
                        </ol>

                        <div className="api-key-input">
                            <input
                                type="password"
                                value={openRouterKey}
                                onChange={(event) => setOpenRouterKeyState(event.target.value)}
                                placeholder="sk-or-..."
                            />
                            <Button size="sm" onClick={handleSaveApiKey}>
                                Save Key
                            </Button>
                        </div>

                        <div className="api-key-links">
                            <a href="https://openrouter.ai/docs" target="_blank" rel="noreferrer">
                                View docs
                            </a>
                            <a href="https://openrouter.ai/credits" target="_blank" rel="noreferrer">
                                Manage credits
                            </a>
                        </div>

                        {generationError && (
                            <div className="api-key-error">{generationError}</div>
                        )}
                    </div>

                    <div className={`render-area ${isProcessing ? 'is-processing': ''}`}>
                        {currentImage ? (
                            <img src={currentImage} alt="AI Render" className="render-img" />
                        ) : (
                            <div className="render-placeholder">
                                {project?.sourceImage && (
                                    <img src={project?.sourceImage} alt="Original" className="render-fallback" />
                                )}
                            </div>
                        )}

                        {isProcessing && (
                            <div className="render-overlay">
                                <div className="rendering-card">
                                    <RefreshCcw className="spinner" />
                                    <span className="title">Rendering...</span>
                                    <span className="subtitle">Generating your 3D visualization</span>
                                </div>
                            </div>
                        )}
                    </div>

                </div>

                <div className="panel compare">
                    <div className="panel-header">
                        <div className="panel-meta">
                            <p>Comparison</p>
                            <h3>Before and After</h3>
                        </div>
                        <div className="hint">Drag to compare</div>
                    </div>

                    <div className="compare-stage">
                        {project?.sourceImage && currentImage ? (
                            <ReactCompareSlider
                                defaultValue={50}
                                style={{ width: '100%', height: 'auto' }}
                                itemOne={
                                    <ReactCompareSliderImage 
                                        src={project?.sourceImage} 
                                        alt="before" 
                                        className="compare-img" 
                                        style={{ objectFit: 'contain', maxHeight: '75vh' }} 
                                    />
                                }
                                itemTwo={
                                    <ReactCompareSliderImage
                                        src={(currentImage || project?.renderedImage) ?? undefined}
                                        alt="after"
                                        className="compare-img"
                                        style={{ objectFit: 'contain', maxHeight: '75vh' }}
                                    />
                                }
                            />
                        ) : (
                            <div className="compare-fallback">
                                {project?.sourceImage && (
                                    <img src={project.sourceImage} alt="Before" className="compare-img" />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    )
}
export default VisualizerId
