// const dropArea = () => document.getElementById('drop-area');
// const contentArea = () => document.getElementById('content');

//   // 기본 동작 방지
//   ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
//     dropArea.addEventListener(eventName, e => e.preventDefault());
//   });

//   // 시각적 효과
//   dropArea.addEventListener('dragover', () => dropArea.classList.add('hover'));
//   dropArea.addEventListener('dragleave', () => dropArea.classList.remove('hover'));
//   dropArea.addEventListener('drop', handleDrop);

//   function handleDrop(event) {
//     dropArea.classList.remove('hover');
//     const file = event.dataTransfer.files[0];

//     if (!file || file.type !== 'application/json') {
//       alert('JSON 형식의 파일만 지원됩니다.');
//       return;
//     }

//     const reader = new FileReader();
//     reader.onload = function (e) {
//       try {
//         const jsonData = JSON.parse(e.target.result);
//         updateUIFromJson(jsonData);
//       } catch (err) {
//         alert('잘못된 JSON 파일입니다.');
//       }
//     };
//     reader.readAsText(file);
//   }

//   function updateUIFromJson(data) {
//     contentArea.innerHTML = ''; // 기존 내용 제거

//     // 타이틀
//     if (data.title) {
//       const title = document.createElement('h2');
//       title.textContent = data.title;
//       contentArea.appendChild(title);
//     }

//     // 항목 리스트
//     if (Array.isArray(data.items)) {
//       const ul = document.createElement('ul');
//       data.items.forEach(item => {
//         const li = document.createElement('li');
//         li.textContent = item;
//         ul.appendChild(li);
//       });
//       contentArea.appendChild(ul);
//     }

//     // 기타 키값 표시
//     const knownKeys = ['title', 'items'];
//     const otherKeys = Object.keys(data).filter(key => !knownKeys.includes(key));
//     if (otherKeys.length > 0) {
//       const div = document.createElement('div');
//       div.innerHTML = '<h4>기타 데이터:</h4><pre>' + JSON.stringify(data, null, 2) + '</pre>';
//       contentArea.appendChild(div);
//     }
//   }