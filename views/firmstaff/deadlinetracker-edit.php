<!-- Header Start -->
    <?php include('header.php'); ?>
<!-- Header End -->

<!-- Sidebar Start -->
    <?php include('sidebar.php'); ?>
<!-- Sidebar End -->

<div class="page-wrapper">
  <div class="content container-fluid">

    <div class="page-header">
      <div class="row align-items-center">
        <div class="col">
          <!-- page header start -->
          <div class="mb-4">
            <h5 class="fw-bold mb-0 d-flex align-items-center">
              <a href="deadlinetracker-list.php" class="text-dark">
                <i class="ti ti-chevron-left me-1"></i>Edit Deadline Tracker
              </a>
            </h5>
          </div>
          <!-- page header end -->
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <form action="#" method="POST">

          <div class="row">

            <!-- Matter ID -->
            <div class="col-md-6 mb-3">
              <label for="matter_id" class="form-label">Matter ID</label>
              <select name="matter_id" id="matter_id" class="form-select">
                <option selected>MAT-001</option>
                <option>MAT-002</option>
              </select>
            </div>

            <!-- Task Description -->
            <div class="col-md-6 mb-3">
              <label for="task_description" class="form-label">Task Description</label>
              <input type="text" name="task_description" id="task_description" value="Submit Court Filing" class="form-control">
            </div>

            <!-- Deadline Date -->
            <div class="col-md-6 mb-3">
              <label for="deadline_date" class="form-label">Deadline Date</label>
              <input type="date" name="deadline_date" id="deadline_date" value="2025-11-10" class="form-control">
            </div>

            <!-- Responsible -->
            <div class="col-md-6 mb-3">
              <label for="responsible" class="form-label">Responsible</label>
              <select name="responsible" id="responsible" class="form-select">
                <option selected>Lawyer</option>
                <option>Paralegal</option>
              </select>
            </div>

            <!-- Priority -->
            <div class="col-md-6 mb-3">
              <label for="priority" class="form-label">Priority</label>
              <select name="priority" id="priority" class="form-select">
                <option>Low</option>
                <option selected>High</option>
                <option>Normal</option>
              </select>
            </div>

            <!-- Alert Via -->
            <div class="col-md-6 mb-3">
              <label class="form-label">Alert Via</label>
              <div class="d-flex align-items-center">
                <div class="form-check me-3">
                  <input class="form-check-input" type="radio" name="alert_via" id="alertEmail" value="Email" checked>
                  <label class="form-check-label" for="alertEmail">Email</label>
                </div>
                <div class="form-check me-3">
                  <input class="form-check-input" type="radio" name="alert_via" id="alertSMS" value="SMS">
                  <label class="form-check-label" for="alertSMS">SMS</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="alert_via" id="alertBoth" value="Both">
                  <label class="form-check-label" for="alertBoth">Both</label>
                </div>
              </div>
            </div>

          </div>

          <!-- Buttons -->
          <div class="text-end mt-4">
            <a href="deadlinetracker-list.php" class="btn btn-light me-2">Cancel</a>
            <button type="submit" class="btn btn-primary">Update Deadline</button>
          </div>

        </form>
      </div>
    </div>

  </div>
</div>

<!-- Footer Start -->
    <?php include('footer.php'); ?>
<!-- Footer End -->
