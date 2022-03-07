import React, {useState, useEffect, useRef, useContext} from 'react'
import {useHistory, useParams, Link} from "react-router-dom"
import usersAPI from '../API/users'
import itemsAPI from '../API/items'
import globalAPI from '../API/global'
import imageAPI from '../API/images'
import fileAPI from '../API/files'
import { OpenItemsContext } from '../Contexts/openItemsContext';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import Shortcut from '../Components/Shortcut'

const Dataset = ({currentUser, type}) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [visibility, setVisibility] = useState(false);
    const [bookmarked, setBookmarked] = useState()
    const [upvoted, setUpvoted] = useState()
    const [upvotes, setUpvotes] = useState()
    const [updated, setUpdated] = useState()
    const [picture, setPicture] = useState()
    const [date, setDate] = useState("")
    const [start, setStart] = useState(0)
    const [end, setEnd] = useState(30)
    const [page, setPage] = useState(1)
    const [image, setImage] = useState();
    const [dataset, setDataset] = useState([]);
    const [labels, setLabels] = useState([])
    const [copyData, setCopyData] = useState(true)
    const [changedSettings, setChangedSettings] = useState(false)
    const [changedData, setChangedData] = useState(false)
    const [uploadedImages, setUploadedImages] = useState([])
    const [imageFiles, setImageFiles] = useState([])
    const [assignedLabels, setAssignedLabels] = useState([])
    const [refreshData, setRefreshData] = useState()
    const [refreshLabels, setRefreshLabels] = useState()
    const [loaded, setLoaded] = useState(false);
    const [exist, setExist] = useState()
    const [noData, setNoData] = useState()
    const [addLabel, setAddLabel] = useState("")
    const [disableCreate, setDisabledCreate] = useState(false)
    const {addOpenItems, removeOpenItems} = useContext(OpenItemsContext);
    const modelRef = useRef(null)
    const datasetID = useParams().id;
    const copyInterval = useRef(0)
    const history = useHistory();

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (type === "create") {
                    const dataset = await usersAPI.get("/created?type=dataset");
    
                    dataset.data.data.map((dataset) => {
                        setDataset(previous => [...previous, dataset.title]);
                    })

                    setExist(true)
                    setLoaded(true)
                } else {
                    const dataset = await itemsAPI.get(`/${datasetID}?type=dataset`);

                    if (dataset.data.data.self) {
                        addOpenItems(dataset.data.data._id, dataset.data.data.title, dataset.data.data.type)
                    }

                    setDataset(dataset.data.data);
                    setUpdated(dataset.data.data.updated);
                    setBookmarked(dataset.data.data.bookmarked)
                    setUpvoted(dataset.data.data.upvoted)
                    setPicture(dataset.data.data.picture)
                    setUpvotes(dataset.data.data.upvotes)
                    setVisibility(dataset.data.data.visibility)
                    setTitle(dataset.data.data.title)
                    setDescription(dataset.data.data.description)
                    setLabels(dataset.data.data.labels)

                    fetch(`http://127.0.0.1:5000/files/${dataset.data.data.imageFile}/labels.json`)
                        .then(response => response.json())
                        .then(images => {
                            images.map(image => {
                                setUploadedImages(state => [...state, image.filename])
                                setAssignedLabels(state => [...state, image.label])
                            })
                            setExist(true)
                            setLoaded(true)
                        }).catch(() => {
                            setExist(true)
                            setLoaded(true)
                        });
                }
            } catch (err) {
              setExist(false)
              setLoaded(true)
            }
        }
        fetchData();
    }, [])

    useEffect(() => {
        if (loaded && exist) {
            const updatedDate = new Date(updated);
            const currentDate = new Date();
    
            if ((currentDate.getTime() - updatedDate.getTime()) / (1000 * 3600 * 24) >= 365) {
                setDate(`Updated ${Math.floor(((currentDate.getTime() - updatedDate.getTime()) / (1000 * 3600 * 24) % 365)).toString()} years ago`)
            } else if ((currentDate.getTime() - updatedDate.getTime()) / (1000 * 3600 * 24) >= 30) {
                setDate(`Updated ${Math.floor(((currentDate.getTime() - updatedDate.getTime()) / (1000 * 3600 * 24) % 30).toString())} months ago`)
            } else if ((currentDate.getTime() - updatedDate.getTime()) / (1000 * 3600 * 24) >= 1) {
                setDate(`Updated ${Math.floor(((currentDate.getTime() - updatedDate.getTime()) / (1000 * 3600 * 24))).toString()} days ago`)
            } else if ((currentDate.getTime() - updatedDate.getTime()) / (1000 * 3600) >= 1) {
                setDate(`Updated ${Math.floor(((currentDate.getTime() - updatedDate.getTime()) / (1000 * 3600))).toString()} hours ago`)
            } else if ((currentDate.getTime() - updatedDate.getTime()) / (1000 * 60) >= 1) {
                setDate(`Updated ${Math.floor(((currentDate.getTime() - updatedDate.getTime()) / (1000 * 60))).toString()} minutes ago`)
            } else {
                setDate("Updated just now")
            }
        }
    }, [loaded, updated])

    const copiedInterval = () => {
        clearInterval(copyInterval.current)
        navigator.clipboard.writeText(dataset.datafile);
        setCopyData(false);
        copyInterval.current = setInterval(() => {
            setCopyData(true);
        }, 800)
        return ()=> {clearInterval(copyInterval.current)};
    }

    const addFunctionKey = (e) => {
        if (e.key === "Enter" && addLabel !== "") {
            setLabels(state => [...state, addLabel])
            setAddLabel("")
        }
    }

    const updateUpvote = async () => {
        try {
            await globalAPI.put(`/upvote/${datasetID}?state=${upvoted}`);

            if (upvoted) {
                setUpvotes(state => state-1)
            } else {
                setUpvotes(state => state+1)
            }

            setUpvoted(state => !state)
        } catch (err) {}
    }

    const updateBookmark = async () => {
        try {
            await globalAPI.put(`/bookmark/${datasetID}?state=${bookmarked}`);
            
            setBookmarked(state => !state)
        } catch (err) {}
    }

    const updateVisibility = async () => {
        try {
            await globalAPI.put(`/visibility/${datasetID}`);

            setVisibility(state => !state)
        } catch (err) {}
    }

    const previousPage = () => {
        if (page > 1) {
            setStart((page-2)*30)
            setEnd((page-1)*30)
            setPage(state => state-1)
            setRefreshData(new Date().getTime())
        }
    }
    
    const nextPage = () => {
        if (page*30 < uploadedImages.length && uploadedImages.length > 30) {
            setPage(state => state+1)
            setStart((page)*30)
            setEnd((page+1)*30)
            setRefreshData(new Date().getTime())
        }
    }

    const deleteImage = async (index) => {
        // if (type === "view") {
        // }
        uploadedImages.splice(index, 1)
        assignedLabels.splice(index, 1)
        setRefreshData(new Date().getTime())
    }

    const addImages = async () => {
        for (let i = 0; i < imageFiles.length; i++) {
            setUploadedImages(state => [...state, imageFiles[i]])
        }

        setAssignedLabels(Array(imageFiles).fill("No label"))
        setPage(1)
        setRefreshData(new Date().getTime())
        setImageFiles([])
    }

    const replaceImages = async () => {
        if (type === "create") {
            for (let i = 0; i < imageFiles.length; i++) {
                setUploadedImages(state => [...state, imageFiles[i]])
            }

            setAssignedLabels(Array(imageFiles).fill("No label"))
            setPage(1)
            setRefreshData(new Date().getTime())
            setImageFiles([])
        } else {
            const formData = new FormData();

            formData.append('id', dataset.imageFile)

            for (let i = 0; i < imageFiles.length; i++) {
                formData.append('data[]', imageFiles[i]);
                formData.append('labels[]', assignedLabels[i]);
            }

            try {
                await fileAPI.post("/replace", formData);

                for (let i = 0; i < imageFiles.length; i++) {
                    setUploadedImages(state => [...state, i])
                }

                setAssignedLabels(Array(imageFiles).fill("No label"))
                setPage(1)
                setRefreshData(new Date().getTime())
                setImageFiles([])
            } catch (err) {}
        }
    }
    
    const appendImages = async () => {
        if (type === "create") {
            for (let i = 0; i < imageFiles.length; i++) {
                setUploadedImages(state => [...state, imageFiles[i]])
            }

            setAssignedLabels(Array(imageFiles).fill("No label"))
            setRefreshData(new Date().getTime())
            setImageFiles([])
        } else {
            const formData = new FormData();

            formData.append('id', dataset.imageFile)
            formData.append('last', uploadedImages[uploadedImages.length-1])

            for (let i = 0; i < imageFiles.length; i++) {
                formData.append('data[]', imageFiles[i]);
                formData.append('labels[]', assignedLabels[i]);
            }

            try {
                await fileAPI.post("/append", formData);

                for (let i = uploadedImages[uploadedImages.length-1]+1; i < imageFiles.length; i++) {
                    setUploadedImages(state => [...state, i])
                }

                setAssignedLabels(Array(imageFiles).fill("No label"))
                setRefreshData(new Date().getTime())
                setImageFiles([])
            } catch (err) {}
        }

        setAssignedLabels(state => [...state, Array(imageFiles).fill("No label")])
        setPage(1)
        setRefreshData(new Date().getTime())
        setImageFiles([])
    }

    const uploadImage = async () => {
        setDisabledCreate(true)

        if (uploadedImages.length !== 0 && !assignedLabels.includes("No label") && title !== "" && description !== "") {
            const formData = new FormData();
            const id = new Date().toISOString();

            formData.append('id', id)

            for (let i = 0; i < uploadedImages.length; i++) {
                formData.append('data[]', uploadedImages[i]);
                formData.append('labels[]', assignedLabels[i]);
            }

            try {
                await fileAPI.post("/upload", formData);
            } catch (err) {}

            if (image) {
                const formImage = new FormData();
                formImage.append('image', image);
                
                try {
                    const imageResponse = await imageAPI.post("/upload", formImage);
    
                    uploadDataset(imageResponse.data.data, id)
                } catch (err) {}
            } else {
                uploadDataset("default.png", id)
            }
        } else {
            setDisabledCreate(false)
        }
    }

    const uploadDataset = async (imageName, id) => {
        try {
            const datasetResponse = await itemsAPI.post("/", {
                title: title,
                imageFile: id,
                creator: currentUser.id,
                description: description,
                picture: imageName,
                upvotes: [],
                bookmarks: [],
                labels: labels,
                updated: new Date().toISOString(),
                visibility: visibility,
                type: "dataset"
            });

            history.push(`/dataset/${datasetResponse.data.data}`)
        } catch (err) {}
    }

    const updateDataset = async () => {
        const formImage = new FormData();
        formImage.append('image', image);
            
        try {
            const tempPicture = picture
            const imageResponse = await imageAPI.post("/upload", formImage);

            await itemsAPI.put(`/${datasetID}?type=dataset`, {
                title: title,
                description: description,
                picture: imageResponse.data.data,
                labels: labels,
                updated: new Date().toISOString()
            })

            setImage(undefined)
            setPicture(imageResponse.data.data)

            if (tempPicture !== "default.png") {
                await imageAPI.put('/remove', {picture: tempPicture});
            }
        } catch (err) {}

        setUpdated(new Date().toISOString())
        setChangedData(false)
        setChangedSettings(false)
    }

    const deleteDataset = async () => {
        try {
            const formData = new formData()

            formData.append('id', dataset.imageFile)

            await itemsAPI.delete(`/${datasetID}`)
            await fileAPI.post("/remove", formData);

            removeOpenItems(datasetID)
            history.replace("/home")
        } catch (err) {}
    }

    return (
        <>
            {loaded && exist ?
                <div className="main-body">
                    <div className="sidebar">
                        <div className="sidebar-header">
                            <img src="http://localhost:3000/dataset.png"
                                    className={!(type === "view" && !dataset.self) ? "create-item-edit-image" : undefined} />
                            <input className={`create-item-title ${!(type === "view" && !dataset.self) && "create-item-edit-input"}`}
                                    placeholder="Title"
                                    onChange={e => {
                                        setTitle(e.target.value)
                                        setChangedSettings(true)
                                    }}
                                    disabled={!(dataset.self || type === "create")}
                                    value={title} />
                        </div>
                        <textarea className={`create-item-description ${!(type === "view" && !dataset.self) && "create-item-edit-textarea"}`}
                                    placeholder="Description"
                                    onChange={e => {
                                        setDescription(e.target.value)
                                        setChangedSettings(true)
                                    }}
                                    disabled={!(dataset.self || type === "create")}
                                    value={description} />
                        {(dataset.self || type === "create") &&
                            <>
                                <div className="create-item-setup">
                                    <label className="create-item-setup-label">Picture</label>
                                    <input className="create-item-setup-input"
                                            type="file" 
                                            name="image" 
                                            onChange={e => {
                                                setImage(e.target.files[0])
                                                setChangedSettings(true)
                                            }} />
                                </div>
                                <div className="create-item-setup">
                                    <label className="create-item-setup-label">Public?</label>
                                    <input type="checkbox" 
                                            onChange={() => {
                                                setVisibility(previous => !previous)
                                                setChangedSettings(true)
                                            }}
                                            checked={visibility} />
                                </div>
                            </>
                        }
                        {!dataset.self && type !== "create" && <p className="item-creator">{dataset.creatorName.name}</p>}
                        <div className="item-information">
                            {type !== "create" && <p className="item-date">{date}</p>}
                            <span />
                            {!dataset.self && type !== "create" && <BookmarkIcon className={`item-icon ${bookmarked ? "blue2" : "white"}`} onClick={() => {updateBookmark()}} />}
                            {dataset.self && type !== "create" && 
                                <>
                                    {visibility ? 
                                        <VisibilityIcon className="item-visibility" onClick={() => {updateVisibility()}} />
                                    :
                                        <VisibilityOffIcon className="item-visibility" onClick={() => {updateVisibility()}} />
                                    }
                                </>
                            }
                            {type !== "create" &&
                                <>
                                    <ThumbUpIcon className={`item-icon ${upvoted ? "blue2" : "white"}`} onClick={() => {updateUpvote()}} />
                                    <p className={upvoted ? "blue2" : "white"}>{upvotes}</p>
                                </>
                            }
                        </div>
                        {type === "view" && !dataset.self &&
                            <>
                                <div className="sidebar-divided" />
                                <div className="sidebar-dataset-copy">
                                    <div>
                                        {copyData ? <p>Data ID</p> : <p>Copied</p>}
                                        <button disabled={!copyData} onClick={() => {copiedInterval()}}>
                                            <ContentCopyIcon className="dataset-copy-icon" />
                                        </button>
                                    </div>
                                    <a href={`http://127.0.0.1:5000/files/${dataset.imageFile}`} download>
                                        <DownloadIcon />
                                    </a>
                                </div>
                            </>
                        }
                        {type === "view" && !dataset.self &&
                            <>
                                <div className="sidebar-divided" />
                                <Shortcut type={"related"} datasetID={datasetID} />
                            </>
                        }
                        {type === "view" &&
                            <>
                                {dataset.self &&
                                    <>
                                        <div className="sidebar-divided" />
                                        <button className="blue-button item-save"
                                                disabled={!changedSettings && !changedData}
                                                onClick={() => {updateDataset()}}>Save Changes</button>
                                        <button className="text-button item-delete"
                                                onClick={() => {deleteDataset()}}>Delete</button>
                                    </>
                                }
                            </>
                        }
                    </div>
                    <div className="inner">
                        <div className="workspace-body">
                            <div className="workspace-inner">
                                {(type === "create" || dataset.self) ?
                                    <>
                                        <div className="view-items-top">
                                            {type === "create" ?
                                                <>
                                                    <h1>Create Dataset</h1>
                                                    <button className="blue-button"
                                                            disabled={disableCreate}
                                                            onClick={() => {uploadImage()}}>Create</button>
                                                </>
                                            :
                                                <p>Dataset</p>
                                            }
                                        </div>
                                        <div className="create-dataset-upload">
                                            <input type="file" 
                                                    name="data"
                                                    accept="image/*"
                                                    multiple
                                                    onChange={e => {setImageFiles(e.target.files)}} />
                                            {type === "create" && uploadedImages.length === 0 && 
                                                <button className="white-button"
                                                        onClick={() => {
                                                            addImages()
                                                            setChangedData(true)
                                                        }}>Add</button>
                                            }
                                            {(dataset.self || type === "create") && uploadedImages.length !== 0 && 
                                                <>
                                                    <button className="white-button"
                                                            onClick={() => {
                                                                setUploadedImages([])
                                                                replaceImages()
                                                                setChangedData(true)
                                                            }}>Replace</button>
                                                    <button className="white-button"
                                                            onClick={() => {
                                                                appendImages()
                                                                setChangedData(true)
                                                            }}>Append</button>
                                                </>
                                            }
                                            {uploadedImages.length !== 0 &&
                                                <div className="create-dataset-pagination">
                                                    <ArrowBackIosNewIcon className="create-dataset-pagination-icon" onClick={() => {previousPage()}} />
                                                    <p>Page {page} / {Math.ceil(uploadedImages.length/30)}</p>
                                                    <ArrowForwardIosIcon className="create-dataset-pagination-icon" onClick={() => {nextPage()}} />
                                                </div>
                                            }
                                        </div>
                                        <div className="create-dataset-images-list" key={refreshData}>
                                            {uploadedImages.map((image, i) => {
                                                if (i >= start && i < end) {
                                                    return (
                                                        <div className="create-dataset-image" key={i}>
                                                            <img src={type === "create" ? URL.createObjectURL(image) : `http://127.0.0.1:5000/files/${dataset.imageFile}/${image}.jpg`} />
                                                            <div>
                                                                <select value={assignedLabels[i]}
                                                                        onChange={e => {setAssignedLabels(state => {
                                                                                    const stateCopy = [...state]
                                                                                
                                                                                    stateCopy[i] = e.target.value
                                                                                
                                                                                    return stateCopy
                                                                                })
                                                                                setChangedData(true)
                                                                                setRefreshLabels(new Date().getTime())}}>
                                                                    <option value="No label">No label</option>
                                                                    {labels.map((label, j) => 
                                                                        <option value={label} key={j}>{label}</option>
                                                                    )}
                                                                </select>
                                                                <div onClick={() => {deleteImage(i)}}>
                                                                    <DeleteIcon className="create-dataset-image-delete" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                }
                                            })}
                                        </div>
                                    </>
                                :   
                                    <>
                                        <div className="view-items-top">
                                            <p>Dataset</p>
                                        </div>
                                        <div className="create-dataset-images-list" key={refreshData}>
                                            {uploadedImages.map((image, i) => {
                                                if (i >= start && i < end) {
                                                    return (
                                                        <div className="create-dataset-image" key={i}>
                                                            <img src={`http://127.0.0.1:5000/files/${dataset.imageFile}/${image}.jpg`} />
                                                            <div>
                                                                <p>{assignedLabels[i]}</p>
                                                            </div>
                                                        </div>
                                                    )
                                                }
                                            })}
                                        </div>
                                    </>
                                }
                            </div>
                            <div className="create-workspace-data">
                                <p className="create-workspace-data-header">Labels:</p>
                                <div className="sidebar-divided" />
                                {(type === "create" || dataset.self) &&
                                    <input className="create-dataset-label-input"
                                            placeholder="Add Label"
                                            onChange={e => {setAddLabel(e.target.value)}}
                                            onKeyPress={addFunctionKey}
                                            value={addLabel} />
                                }
                                <div className="create-dataset-labels-list">
                                    {labels.map((label, i) => {
                                        return (
                                            <div className="create-dataset-label" key={i}>
                                                <p>{label}</p>
                                                {(type === "create" || dataset.self) &&
                                                    <div onClick={() => {
                                                        assignedLabels.map((assignedLabel, j) => {
                                                            if (assignedLabel === labels[i]) {
                                                                setAssignedLabels(state => {
                                                                    const stateCopy = [...state]
                                                                
                                                                    stateCopy[j] = "No label"
                                                                
                                                                    return stateCopy
                                                                })
                                                            }
                                                        })
                                                        labels.splice(i, 1)
                                                        setRefreshLabels(new Date().getTime())
                                                    }}>
                                                        <CloseIcon className="create-dataset-label-icon" /> 
                                                    </div>
                                                }
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            : loaded && !exist &&
                <div className="inner-body">  
                    <p className="item-exist">Cannot find dataset</p>
                </div>
            }
        </>
    )
}

export default Dataset